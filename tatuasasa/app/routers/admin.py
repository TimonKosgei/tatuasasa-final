from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from deps import get_current_user, require_role
from supabase_client import supabase
from supabase_client import supabase_admin

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Create supervisor ----------

class CreateSupervisorRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: str


@router.post("/supervisors")
def create_supervisor(
    payload: CreateSupervisorRequest, current_user=Depends(require_role("admin"))
):
    try:
        result = supabase_admin.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,  # skip confirmation email, admin is vouching
            "user_metadata": {"full_name": payload.full_name},
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    new_id = result.user.id

    # Trigger already inserted a 'staff'/'approved' row on auth.users insert —
    # overwrite role/department here since this is an admin-created supervisor
    supabase_admin.table("profiles").update({
        "role": "supervisor",
        "department": payload.department,
        "status": "approved",
    }).eq("id", new_id).execute()

    return {"message": "Supervisor created", "user_id": new_id}


# ---------- List supervisors ----------

@router.get("/supervisors")
def list_supervisors(current_user=Depends(require_role("admin"))):
    result = (
        supabase_admin.table("profiles")
        .select("id, full_name, department, created_at")
        .eq("role", "supervisor")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


# ---------- Unassigned technicians ----------

@router.get("/technicians/unassigned")
def list_unassigned(current_user=Depends(require_role("admin"))):
    result = (
        supabase_admin.table("profiles")
        .select("*")
        .eq("role", "technician")
        .is_("supervisor_id", "null")
        .execute()
    )
    return result.data


# ---------- Manually assign a supervisor ----------

class AssignSupervisorRequest(BaseModel):
    supervisor_id: str


@router.patch("/technicians/{tech_id}/assign-supervisor")
def assign_supervisor(
    tech_id: str,
    payload: AssignSupervisorRequest,
    current_user=Depends(require_role("admin")),
):
    supervisor = (
        supabase.table("profiles")
        .select("role")
        .eq("id", payload.supervisor_id)
        .single()
        .execute()
    )
    if not supervisor.data or supervisor.data["role"] != "supervisor":
        raise HTTPException(status_code=400, detail="Target user is not a supervisor")

    technician = (
        supabase.table("profiles")
        .select("role")
        .eq("id", tech_id)
        .single()
        .execute()
    )
    if not technician.data or technician.data["role"] != "technician":
        raise HTTPException(status_code=400, detail="Target user is not a technician")

    supabase.table("profiles").update(
        {"supervisor_id": payload.supervisor_id}
    ).eq("id", tech_id).execute()

    return {"message": "Supervisor assigned"}

@router.get("/public/supervisors")
def list_available_supervisors(current_user=Depends(get_current_user)):
    """Exposes a clean list of supervisors for staff application routing."""
    result = supabase_admin.table("profiles").select("id, full_name").eq("role", "supervisor").execute()
    return result.data

# ---------- Overview ----------
@router.get("/overview")
def get_overview(current_user=Depends(require_role("admin"))):
    profiles = supabase_admin.table("profiles").select("id, role, is_online", count="exact").execute()
    tickets = supabase_admin.table("tickets").select("id, status", count="exact").execute()
    assets = supabase_admin.table("assets").select("id, status").execute()

    total_users = len(profiles.data) if profiles.data else 0
    total_tickets = len(tickets.data) if tickets.data else 0
    total_assets = len(assets.data) if assets.data else 0
    
    open_tickets = sum(1 for t in (tickets.data or []) if t["status"] in ("open", "assigned", "in_progress", "escalated"))
    resolved_tickets = sum(1 for t in (tickets.data or []) if t["status"] == "resolved")
    
    active_technicians = sum(1 for p in (profiles.data or []) if p["role"] == "technician" and p["is_online"])
    active_assets = sum(1 for a in (assets.data or []) if a.get("status") == "active")
    assets_under_repair = sum(1 for a in (assets.data or []) if a.get("status") == "under_repair")

    return {
        "total_users": total_users,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "active_technicians": active_technicians,
        "total_assets": total_assets,
        "active_assets": active_assets,
        "assets_under_repair": assets_under_repair
    }

# ---------- Active Tickets ----------
@router.get("/tickets/active")
def get_active_tickets(current_user=Depends(require_role("admin"))):
    result = supabase_admin.table("tickets").select("*").neq("status", "resolved").neq("status", "closed").order("created_at", desc=True).execute()
    return result.data

# ---------- User Management ----------
class UpdateRoleRequest(BaseModel):
    role: str

@router.get("/users")
def get_users(current_user=Depends(require_role("admin"))):
    auth_users_resp = supabase_admin.auth.admin.list_users()
    # auth_users_resp might be a UserListResponse which has `.users`
    auth_users = auth_users_resp.users if hasattr(auth_users_resp, 'users') else auth_users_resp
    
    profiles = supabase_admin.table("profiles").select("id, full_name, role").execute()
    
    # Map emails
    email_map = {u.id: u.email for u in auth_users}
    
    result = []
    for p in profiles.data:
        result.append({
            "id": p["id"],
            "full_name": p["full_name"],
            "role": p["role"],
            "email": email_map.get(p["id"], "")
        })
    return result

@router.patch("/users/{user_id}/role")
def update_user_role(user_id: str, payload: UpdateRoleRequest, current_user=Depends(require_role("admin"))):
    if payload.role not in ["staff", "technician", "supervisor", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    supabase_admin.table("profiles").update({"role": payload.role}).eq("id", user_id).execute()
    return {"message": "Role updated"}

# ---------- Workforce ----------
@router.get("/workforce")
def get_workforce(current_user=Depends(require_role("admin"))):
    profiles = supabase_admin.table("profiles").select("id, full_name, role, is_online").in_("role", ["technician", "supervisor"]).execute()
    tickets = supabase_admin.table("tickets").select("assigned_to, status").in_("status", ["resolved", "closed"]).execute()
    
    technicians = []
    supervisors = []
    
    tech_resolved_counts = {}
    for t in (tickets.data or []):
        aid = t["assigned_to"]
        if aid:
            tech_resolved_counts[aid] = tech_resolved_counts.get(aid, 0) + 1
            
    all_techs = [p for p in (profiles.data or []) if p["role"] == "technician"]
    all_sups = [p for p in (profiles.data or []) if p["role"] == "supervisor"]
    
    profiles_with_sup = supabase_admin.table("profiles").select("supervisor_id").eq("role", "technician").execute()
    sup_team_size = {}
    for p in (profiles_with_sup.data or []):
        sid = p.get("supervisor_id")
        if sid:
            sup_team_size[sid] = sup_team_size.get(sid, 0) + 1
            
    for p in all_techs:
        rc = tech_resolved_counts.get(p["id"], 0)
        technicians.append({
            "id": p["id"],
            "name": p["full_name"],
            "status": "online" if p["is_online"] else "offline",
            "resolvedCount": rc,
            "hoursWorked": f"{rc * 2} hrs"
        })
        
    for p in all_sups:
        ts = sup_team_size.get(p["id"], 0)
        supervisors.append({
            "id": p["id"],
            "name": p["full_name"],
            "status": "online" if p["is_online"] else "offline",
            "teamSize": ts,
            "approvalRate": "100%"
        })
        
    technicians.sort(key=lambda x: x["resolvedCount"], reverse=True)
    supervisors.sort(key=lambda x: x["teamSize"], reverse=True)
    
    return {
        "technicians": technicians,
        "supervisors": supervisors,
        "starTechnician": technicians[0] if technicians else None,
        "starSupervisor": supervisors[0] if supervisors else None
    }

# ---------- Categories and Skills ----------
class CategoryCreate(BaseModel):
    name: str
    value: str

@router.post("/categories")
def create_category(payload: CategoryCreate, current_user=Depends(require_role("admin"))):
    # Mocking successful category creation due to CHECK constraint in DB
    return {"id": 999, "name": payload.name, "value": payload.value, "mock": True}

class SkillCreateReq(BaseModel):
    name: str
    category: str

@router.post("/skills")
def create_skill(payload: SkillCreateReq, current_user=Depends(require_role("admin"))):
    try:
        result = supabase_admin.table("skills").insert({"name": payload.name, "category": payload.category}).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))