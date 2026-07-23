import os
from dotenv import load_dotenv
from supabase import create_client
import json

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

def get_my_tickets():
    result = (
        supabase.table("tickets")
        .select("*, assignee:profiles!tickets_assigned_to_fkey(full_name)")
        .execute()
    )
    tickets = []
    for t in result.data:
        t["technician_name"] = t.get("assignee", {}).get("full_name") if t.get("assignee") else None
        t.pop("assignee", None)
        tickets.append(t)
    print(json.dumps(tickets, indent=2))

get_my_tickets()
