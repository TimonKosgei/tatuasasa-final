import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

try:
    res = supabase.table("tickets").select("id, status, assigned_to, submitted_by, assignee:profiles!tickets_assigned_to_fkey(full_name), staff:profiles!tickets_submitted_by_fkey(full_name)").execute()
    for t in res.data:
        print(f"Ticket {t['id']}: Status={t['status']}, Assignee={t['assignee']}, Staff={t['staff']}")
except Exception as e:
    print("Error:", str(e))
