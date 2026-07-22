import os
from dotenv import load_dotenv
from supabase import create_client
import time

load_dotenv()

supabase_admin = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

PROTECTED_EMAILS = {
    "admin@tatuasasa.dev",
    "supervisor@tatuasasa.dev",
    "tech1@tatuasasa.dev",
    "tech2@tatuasasa.dev",
    "tech3@tatuasasa.dev",
    "staff1@tatuasasa.dev",
    "staff2@tatuasasa.dev",
    "staff3@tatuasasa.dev"
}

def cleanup():
    print("Fetching all users...")
    users = supabase_admin.auth.admin.list_users()
    
    deleted_count = 0
    for u in users:
        if u.email not in PROTECTED_EMAILS:
            print(f"Deleting user: {u.email} (ID: {u.id})")
            try:
                supabase_admin.auth.admin.delete_user(u.id)
                deleted_count += 1
                time.sleep(0.1) # basic rate limiting
            except Exception as e:
                print(f"Failed to delete {u.email}: {e}")
                
    print(f"Cleanup complete. Deleted {deleted_count} users.")

if __name__ == "__main__":
    cleanup()
