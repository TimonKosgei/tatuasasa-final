import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

try:
    res = supabase.table("tickets").select("id, profiles!tickets_assigned_to_fkey(full_name)").limit(1).execute()
    print("Option 1:", res.data)
except Exception as e:
    print("Error 1:", str(e))

try:
    res = supabase.table("tickets").select("id, assigned_to:profiles!tickets_assigned_to_fkey(full_name)").limit(1).execute()
    print("Option 2:", res.data)
except Exception as e:
    print("Error 2:", str(e))

try:
    res = supabase.table("tickets").select("id, profiles!tickets_submitted_by_fkey(full_name)").limit(1).execute()
    print("Option 3:", res.data)
except Exception as e:
    print("Error 3:", str(e))
