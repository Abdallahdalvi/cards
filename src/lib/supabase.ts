import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.dalvi.cloud';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjQxMDI0NDQ4MDB9.0WkOW6P5n4cmZxft1WHV-REaQ5C0WqaARxSTXFcq4Cc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Namespace the localStorage key so it never collides with other apps
    storageKey: "cards-supabase-auth",
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
