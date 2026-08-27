from supabase import Client, create_client

from app.config import settings


supabase: Client = None

if settings.supabase_url and settings.supabase_secret_key:
    try:
        supabase = create_client(
            settings.supabase_url,
            settings.supabase_secret_key
        )
    except Exception as e:
        print(f"[Warning] Could not initialize Supabase client: {e}")
        supabase = None