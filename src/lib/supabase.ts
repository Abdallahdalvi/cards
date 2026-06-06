import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://supabase.dalvi.cloud";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwNTE2MDU5LCJleHAiOjQxMDI0NDQ4MDB9.pnle16TS5HXFkORp9nrU5GMbTU3BaNf8XzLfguweAUg";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep Cards isolated from other Dalvi apps while using the same auth.users table.
    storageKey: "cards-supabase-auth",
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
