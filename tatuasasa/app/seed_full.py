import os
from dotenv import load_dotenv
from supabase import create_client
import time

load_dotenv()

supabase_admin = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

def create_user(email, password, full_name, role, status="approved", department=None, office_id=None, supervisor_id=None):
    print(f"Creating user {email}...")
    # Attempt to delete first just in case
    try:
        existing = supabase_admin.auth.admin.list_users()
        for u in existing:
            if u.email == email:
                supabase_admin.auth.admin.delete_user(u.id)
                time.sleep(0.5)
                break
    except Exception as e:
        pass

    try:
        result = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name},
        })
        user_id = result.user.id
        
        # Give profile triggers time to run
        time.sleep(1)
        
        update_data = {
            "role": role,
            "status": status,
        }
        if department:
            update_data["department"] = department
        if office_id:
            update_data["office_id"] = office_id
        if supervisor_id:
            update_data["supervisor_id"] = supervisor_id

        supabase_admin.table("profiles").update(update_data).eq("id", user_id).execute()
        return user_id
    except Exception as e:
        print(f"Error creating user {email}: {e}")
        return None

def seed():
    print("Starting seed...")

    # 1. Create Offices
    print("Creating Offices...")
    offices_to_create = [
        {"building_id": 1, "floor": "3rd", "room_code": "301", "department_id": 1, "name": "ICT Hub"},
        {"building_id": 1, "floor": "4th", "room_code": "405", "department_id": 2, "name": "Finance Head Office"},
        {"building_id": 2, "floor": "1st", "room_code": "102", "department_id": 3, "name": "Central Registry"},
        {"building_id": 2, "floor": "2nd", "room_code": "204", "department_id": 4, "name": "HR Directorate"}
    ]
    # Delete existing offices to prevent duplicate errors if rerun
    supabase_admin.table("offices").delete().neq("id", -1).execute()
    
    res = supabase_admin.table("offices").insert(offices_to_create).execute()
    offices = {o["name"]: o["id"] for o in res.data}

    # 2. Users
    print("Creating Profiles...")
    sup_id = create_user("supervisor@tatuasasa.dev", "Password123!", "Jane Supervisor", "supervisor", department="ICT Support", office_id=offices["ICT Hub"])
    
    tech1_id = create_user("tech1@tatuasasa.dev", "Password123!", "Brian Tech", "technician", department="ICT Support", office_id=offices["ICT Hub"], supervisor_id=sup_id)
    tech2_id = create_user("tech2@tatuasasa.dev", "Password123!", "Amina Hardware", "technician", department="ICT Support", office_id=offices["ICT Hub"], supervisor_id=sup_id)
    tech3_id = create_user("tech3@tatuasasa.dev", "Password123!", "Daniel Network", "technician", department="ICT Support", office_id=offices["ICT Hub"], supervisor_id=sup_id)

    staff1_id = create_user("staff1@tatuasasa.dev", "Password123!", "John Finance", "staff", department="Finance", office_id=offices["Finance Head Office"])
    staff2_id = create_user("staff2@tatuasasa.dev", "Password123!", "Mary Registry", "staff", department="Registry", office_id=offices["Central Registry"])
    staff3_id = create_user("staff3@tatuasasa.dev", "Password123!", "Peter HR", "staff", department="HR", office_id=offices["HR Directorate"])

    # 3. Technician Skills
    print("Assigning Technician Skills...")
    supabase_admin.table("technician_skills").delete().neq("user_id", '00000000-0000-0000-0000-000000000000').execute()
    skills_insert = []
    if tech1_id:
        skills_insert.extend([
            {"user_id": tech1_id, "skill_id": 1, "proficiency_level": "expert"}, # Network Troubleshooting
            {"user_id": tech1_id, "skill_id": 2, "proficiency_level": "intermediate"} # Router Config
        ])
    if tech2_id:
        skills_insert.extend([
            {"user_id": tech2_id, "skill_id": 6, "proficiency_level": "expert"}, # Laptop Repair
            {"user_id": tech2_id, "skill_id": 7, "proficiency_level": "intermediate"} # Peripheral Setup
        ])
    if tech3_id:
        skills_insert.extend([
            {"user_id": tech3_id, "skill_id": 8, "proficiency_level": "intermediate"}, # Windows Server
            {"user_id": tech3_id, "skill_id": 12, "proficiency_level": "expert"} # Printer Repair
        ])
    if skills_insert:
        supabase_admin.table("technician_skills").insert(skills_insert).execute()

    # 4. Assets
    print("Creating Assets...")
    supabase_admin.table("assets").delete().neq("id", '00000000-0000-0000-0000-000000000000').execute()
    assets = [
        {"asset_tag": "AST-1001", "name": "Dell Latitude 5420", "category": "hardware", "office_id": offices["Finance Head Office"], "assigned_to": staff1_id},
        {"asset_tag": "AST-1002", "name": "HP EliteBook 840", "category": "hardware", "office_id": offices["Central Registry"], "assigned_to": staff2_id},
        {"asset_tag": "AST-2001", "name": "HP LaserJet Pro MFP", "category": "printers", "office_id": offices["HR Directorate"]},
        {"asset_tag": "AST-2002", "name": "Canon imageRUNNER", "category": "printers", "office_id": offices["Finance Head Office"]},
        {"asset_tag": "AST-3001", "name": "Cisco ISR 4331 Router", "category": "network", "office_id": offices["ICT Hub"]}
    ]
    assets_res = supabase_admin.table("assets").insert(assets).execute()
    asset_map = {a["asset_tag"]: a["id"] for a in assets_res.data}

    # 5. Tickets
    print("Creating Tickets...")
    supabase_admin.table("solved_tickets").delete().neq("id", '00000000-0000-0000-0000-000000000000').execute()
    supabase_admin.table("ticket_messages").delete().neq("id", '00000000-0000-0000-0000-000000000000').execute()
    supabase_admin.table("tickets").delete().neq("id", -1).execute()

    tickets_to_create = [
        # Open tickets
        {
            "title": "Laptop screen flickering", "description": "My screen goes blank occasionally.", "category": "hardware",
            "priority": "medium", "status": "open", "submitted_by": staff1_id, "asset_id": asset_map.get("AST-1001")
        },
        {
            "title": "Cannot access payroll system", "description": "Getting a 403 error.", "category": "software",
            "priority": "high", "status": "open", "submitted_by": staff3_id
        },
        # In Progress tickets
        {
            "title": "Internet is down", "description": "No WiFi in the office.", "category": "network",
            "priority": "urgent", "status": "in_progress", "submitted_by": staff2_id, "assigned_to": tech1_id
        },
        {
            "title": "Printer jammed", "description": "Paper jam error 13.B9.", "category": "printers",
            "priority": "medium", "status": "in_progress", "submitted_by": staff1_id, "assigned_to": tech2_id, "asset_id": asset_map.get("AST-2002")
        },
        # Escalated ticket
        {
            "title": "Server unresponsive", "description": "Main file server is down.", "category": "hardware",
            "priority": "urgent", "status": "open", "submitted_by": staff3_id, "assigned_to": tech3_id,
            "is_escalated": True, "escalated_by": tech3_id, "rejection_reasons": [{"reason": "Requires supervisor password to access rack", "by": "tech"}]
        },
        # Resolved ticket
        {
            "title": "Need VPN access", "description": "Working from home tomorrow.", "category": "network",
            "priority": "low", "status": "resolved", "submitted_by": staff2_id, "assigned_to": tech1_id,
            "resolution_notes": '["Granted VPN profile.", "Sent instructions."]', "kb_published": "none"
        },
        # Pending KB
        {
            "title": "Fixing the Canon scanner issue", "description": "Scanner drivers are missing.", "category": "printers",
            "priority": "low", "status": "resolved", "submitted_by": staff1_id, "assigned_to": tech2_id,
            "resolution_notes": '["Updated firmware", "Reinstalled TWAIN driver"]', "kb_published": "pending_approval"
        }
    ]
    tickets_res = supabase_admin.table("tickets").insert(tickets_to_create).execute()
    
    # 6. Messages
    print("Creating Chat Messages...")
    ticket_wifi = next(t for t in tickets_res.data if t["title"] == "Internet is down")
    supabase_admin.table("ticket_messages").insert([
        {"ticket_id": ticket_wifi["id"], "sender_id": staff2_id, "sender_role": "staff", "body": "Any update on this? We can't work."},
        {"ticket_id": ticket_wifi["id"], "sender_id": tech1_id, "sender_role": "technician", "body": "I'm checking the switch on the 1st floor now. Should be up in 5 mins."}
    ]).execute()

    print("Seeding Complete!")

if __name__ == "__main__":
    seed()
