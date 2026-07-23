import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

sql = """
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS location_building text,
ADD COLUMN IF NOT EXISTS location_floor text,
ADD COLUMN IF NOT EXISTS location_room text,
ADD COLUMN IF NOT EXISTS assigned_department text;
"""

try:
    # Use RPC to run SQL if available, or just create a script for the user
    print("Please run the following SQL in your Supabase SQL Editor:")
    print(sql)
except Exception as e:
    print(e)
