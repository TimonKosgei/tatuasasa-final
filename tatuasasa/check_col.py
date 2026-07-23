import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

try:
    res = supabase.table("ticket_messages").select("status").limit(1).execute()
    print("Column exists:", res.data)
except Exception as e:
    print("Error:", str(e))
