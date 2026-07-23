from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from deps import get_current_user, require_role
from supabase_client import supabase_admin
from datetime import datetime, timezone

router = APIRouter(prefix="/assets", tags=["assets"])

class AssetCreate(BaseModel):
    asset_tag: str
    name: str
    category: str
    serial_number: Optional[str] = None
    location_building: Optional[str] = None
    location_floor: Optional[str] = None
    location_room: Optional[str] = None
    assigned_department: Optional[str] = None

class BulkAssetCreate(BaseModel):
    assets: List[AssetCreate]

@router.get("", dependencies=[Depends(require_role("technician", "supervisor", "admin"))])
def list_assets(search: Optional[str] = None):
    """
    Search assets by asset tag, name, or serial number.
    Includes location context via office and building relations.
    """
    query = supabase_admin.table("assets").select("*, offices(name, room_code, buildings(name)), profiles!assets_assigned_to_fkey(full_name)")
    
    if search:
        query = query.or_(f"asset_tag.ilike.%{search}%,name.ilike.%{search}%,serial_number.ilike.%{search}%")
        
    res = query.execute()
    return res.data

@router.get("/{asset_tag}/history")
def get_asset_maintenance_history(asset_tag: str):
    """
    Returns maintenance and ticket repair history for a given asset tag.
    Allows technicians and AI guidance to spot reoccurring hardware failures.
    """
    asset_res = supabase_admin.table("assets").select("id, name, asset_tag, status").eq("asset_tag", asset_tag).execute()
    
    if not asset_res.data:
        raise HTTPException(status_code=404, detail="Asset tag not found")
        
    asset = asset_res.data[0]
    
    tickets_res = (
        supabase_admin.table("tickets")
        .select("id, title, status, category, resolution_notes, created_at, resolved_at")
        .eq("asset_id", asset["id"])
        .order("created_at", desc=True)
        .execute()
    )
    
    tickets = tickets_res.data
    frequency = len(tickets)
    
    # Calculate downtime and map resolution steps
    history = []
    for t in tickets:
        downtime_hours = None
        if t["created_at"] and t["resolved_at"]:
            try:
                # Calculate downtime in hours
                created = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                resolved = datetime.fromisoformat(t["resolved_at"].replace("Z", "+00:00"))
                downtime_hours = round((resolved - created).total_seconds() / 3600, 2)
            except Exception:
                pass
        
        history.append({
            "ticket_id": t["id"],
            "title": t["title"],
            "status": t["status"],
            "resolution_notes": t["resolution_notes"],
            "created_at": t["created_at"],
            "resolved_at": t["resolved_at"],
            "downtime_hours": downtime_hours
        })
    
    # Health signal logic: e.g. more than 2 tickets in the history is a warning
    health_signal = "healthy"
    if frequency >= 3:
        health_signal = "warning: multiple recurring issues"
    
    return {
        "asset": asset,
        "metrics": {
            "ticket_frequency": frequency,
            "health_signal": health_signal
        },
        "history": history
    }

@router.post("", dependencies=[Depends(require_role("supervisor", "admin"))])
def create_asset(payload: AssetCreate):
    """Register a new asset into inventory."""
    res = supabase_admin.table("assets").insert(payload.model_dump(exclude_none=True)).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create asset")
    return res.data[0]

@router.post("/bulk", dependencies=[Depends(require_role("supervisor", "admin"))])
def create_assets_bulk(payload: BulkAssetCreate):
    """Register multiple assets from bulk import."""
    dumped = [p.model_dump(exclude_none=True) for p in payload.assets]
    res = supabase_admin.table("assets").insert(dumped).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to bulk insert assets")
    return {"message": f"Successfully imported {len(res.data)} assets.", "count": len(res.data)}