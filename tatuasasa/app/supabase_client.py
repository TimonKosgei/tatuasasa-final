import os
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx
import threading

_original_send = httpx.Client.send
_httpx_lock = threading.Lock()

def _locked_send(self, *args, **kwargs):
    with _httpx_lock:
        return _original_send(self, *args, **kwargs)

httpx.Client.send = _locked_send
 
load_dotenv()
 
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# anon key client — respects RLS, this is what auth endpoints use
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

#admin
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)