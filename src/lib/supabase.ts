import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[cards] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Create a .env file based on .env.example and restart the dev server."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Namespace the localStorage key so it never collides with other apps
    storageKey: "cards-supabase-auth",
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
