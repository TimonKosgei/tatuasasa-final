#pending applications, approve/reject, list my team -Supervisor, Admin
from fastapi import APIRouter, HTTPException, Depends
from deps import get_current_user, require_role
from typing import Optional, List
from supabase_client import supabase, supabase_admin

router = APIRouter(prefix="/supervisor", tags=["supervisors"])


def _fetch_skills_for(user_id: str):
    result = (
        supabase_admin.table("technician_skills")
        .select("proficiency_level, skills(id, name, category)")
        .eq("user_id", user_id)
        .execute()
    )
    return [
        {
            "id": row["skills"]["id"],
            "name": row["skills"]["name"],
            "category": row["skills"]["category"],
            "level": {"beginner": 1, "intermediate": 2, "expert": 3}[row["proficiency_level"]],
        }
        for row in result.data
    ]

#checks if the current user is allowed to act on the application of the applicant
def _assert_owns_application(current_user, applicant_profile):
    """A supervisor can only act on applications addressed to them. Admins can act on any."""
    if current_user["profile"]["role"] == "admin":
        return
    if applicant_profile["supervisor_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="This application wasn't submitted to you")

#helper to get email of a user by their id 
def _get_email(user_id: str) -> str | None:
    try:
        user = supabase_admin.auth.admin.get_user_by_id(user_id)
        return user.user.email
    except Exception:
        return None

@router.get("/applications/pending", dependencies=[Depends(require_role("supervisor", "admin"))])
def list_pending_applications(current_user=Depends(get_current_user)):
    query = supabase_admin.table("profiles").select("*").eq("application_status", "pending")

    # Admins can optionally see everyone's queue; supervisors only see their own
    if current_user["profile"]["role"] != "admin":
        query = query.eq("supervisor_id", current_user["id"])

    result = query.execute()

    return [
        {
            "id": p["id"],
            "full_name": p["full_name"],
            "email": _get_email(p["id"]),
            "department": p.get("department"),
            "applied_on": p.get("updated_at"),
            "skills": _fetch_skills_for(p["id"]),
        }
        for p in result.data
    ]


@router.get("/metrics/workload", dependencies=[Depends(require_role("supervisor", "admin"))])
def get_team_workload(current_user=Depends(get_current_user)):
    query = supabase_admin.table("profiles").select("id, full_name").eq("role", "technician").eq("is_approved", True)
    if current_user["profile"]["role"] != "admin":
        query = query.eq("supervisor_id", current_user["id"])
    
    techs = query.execute().data
    tech_ids = [t["id"] for t in techs]

    tickets = supabase_admin.table("tickets").select("assigned_to, status, priority, is_escalated").in_("assigned_to", tech_ids).execute().data
    
    workloads = []
    for t in techs:
        tech_t = [x for x in tickets if x["assigned_to"] == t["id"]]
        workloads.append({
            "id": t["id"],
            "name": t["full_name"],
            "open": sum(1 for x in tech_t if x["status"] == "open"),
            "in_progress": sum(1 for x in tech_t if x["status"] in ["assigned", "in_progress"]),
            "resolved": sum(1 for x in tech_t if x["status"] == "resolved"),
            "escalated": sum(1 for x in tech_t if x["is_escalated"]),
            "urgent": sum(1 for x in tech_t if x["priority"] in ["urgent", "high"] and x["status"] != "closed"),
        })

    return workloads

@router.get("/pending-kb", dependencies=[Depends(require_role("supervisor", "admin"))])
def get_pending_kb_approvals(current_user=Depends(get_current_user)):
    """
    Fetch tickets that are marked as 'pending_approval' for the AI knowledge base.
    If supervisor, fetch their team's tickets.
    """
    query = supabase_admin.table("tickets").select("*").eq("kb_published", "pending_approval")
    
    if current_user["profile"]["role"] != "admin":
        # Only show tickets assigned to techs under this supervisor
        techs_res = supabase_admin.table("profiles").select("id").eq("supervisor_id", current_user["id"]).execute()
        tech_ids = [t["id"] for t in techs_res.data]
        if tech_ids:
            query = query.in_("assigned_to", tech_ids)
        else:
            return [] # Empty team
            
    res = query.execute()
    return res.data

@router.get("/technicians", dependencies=[Depends(require_role("supervisor", "admin"))])
def list_my_technicians(current_user=Depends(get_current_user)):
    """
    Returns only the technicians who explicitly report to this supervisor,
    resolving their email addresses and calculating their active workloads dynamically.
    """
    role = current_user["profile"]["role"]

    # 1. Base query for active, approved technicians (removed current_workload and email)
    query = (
        supabase_admin.table("profiles")
        .select("id, full_name, is_online, department, supervisor_id")
        .eq("role", "technician")
        .eq("application_status", "approved")
    )

    # Enforce strict direct reporting line for supervisors
    if role == "supervisor":
        query = query.eq("supervisor_id", current_user["id"])

    result = query.execute()
    
    # 2. Fetch all tickets that are currently open or in progress to compute dynamic workloads
    tickets_query = (
        supabase_admin.table("tickets")
        .select("assigned_to")
        .in_("status", ["open", "assigned", "in_progress"])
        .execute()
    )
    
    # Create a fast lookup counter for active ticket workloads
    # e.g., {"tech_uuid_1": 3, "tech_uuid_2": 1}
    workload_counter = {}
    for ticket in tickets_query.data:
        tech_id = ticket.get("assigned_to")
        if tech_id:
            workload_counter[tech_id] = workload_counter.get(tech_id, 0) + 1

    # 3. Build the final payload with dynamically resolved emails and workloads
    technicians = []
    for p in result.data:
        tech_id = p["id"]
        technicians.append({
            "id": tech_id,
            "full_name": p["full_name"],
            "email": _get_email(tech_id),  # Cleanly resolves via your Auth Admin helper
            "is_online": p.get("is_online", False),
            "department": p.get("department"),
            "supervisor_id": p.get("supervisor_id"),
            "current_workload": workload_counter.get(tech_id, 0)  # Computes dynamic workload accurately
        })

    return technicians

@router.post("/applications/{user_id}/approve", dependencies=[Depends(require_role("supervisor", "admin"))])
def approve_application(user_id: str, current_user=Depends(get_current_user)):
    applicant = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
    if not applicant.data:
        raise HTTPException(status_code=404, detail="Applicant not found")

    _assert_owns_application(current_user, applicant.data)

    if applicant.data["application_status"] != "pending":
        raise HTTPException(status_code=400, detail="This application is not pending")

    supabase_admin.table("profiles").update({
        "role": "technician",
        "application_status": "approved",
    }).eq("id", user_id).execute()

    return {"message": f"{applicant.data['full_name']} approved as technician"}


@router.post("/applications/{user_id}/reject", dependencies=[Depends(require_role("supervisor", "admin"))])
def reject_application(user_id: str, current_user=Depends(get_current_user)):
    applicant = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
    if not applicant.data:
        raise HTTPException(status_code=404, detail="Applicant not found")

    _assert_owns_application(current_user, applicant.data)

    if applicant.data["application_status"] != "pending":
        raise HTTPException(status_code=400, detail="This application is not pending")

    supabase_admin.table("profiles").update({
        "application_status": "rejected",
    }).eq("id", user_id).execute()

    return {"message": f"{applicant.data['full_name']}'s application was rejected"}



@router.get("", dependencies=[Depends(require_role("supervisor", "admin"))])
def list_supervisor_tickets(status: Optional[str] = None, current_user=Depends(get_current_user)):
    """
    Supervisors only see tickets assigned to their direct technicians, 
    or unassigned tickets escalated by their team pool.
    """
    role = current_user["profile"]["role"]

    if role == "admin":
        # Admins see everything globally
        query = supabase_admin.table("tickets").select("*").order("created_at", desc=True)
        if status:
            query = query.eq("status", status)
        return query.execute().data

    # --- SUPERVISOR LOGIC ---
    # 1. Fetch the IDs of all technicians who report to this supervisor
    my_techs_query = (
        supabase_admin.table("profiles")
        .select("id")
        .eq("supervisor_id", current_user["id"])
        .execute()
    )
    my_tech_ids = [tech["id"] for tech in my_techs_query.data]

    # 2. Map structural array data into strings for the .or_ filter
    tech_ids_str = ",".join(my_tech_ids) if my_tech_ids else "null"
    
    # We query tickets matching:
    # - current assignee is one of your direct technicians
    # - OR it's unassigned but flagged as escalated by one of your technicians
    query = (
        supabase_admin.table("tickets")
        .select("*")
        .or_(f"assigned_to.in.({tech_ids_str}),and(is_escalated.eq.true,escalated_by.in.({tech_ids_str}))")
        .order("created_at", desc=True)
    )

    if status:
        query = query.eq("status", status)

    result = query.execute()
    return result.data