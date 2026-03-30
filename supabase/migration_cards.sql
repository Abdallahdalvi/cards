-- ============================================================
-- cards app database schema
-- Run this in: supabase.dalvi.cloud → SQL Editor
-- ============================================================

-- cards_folders: event/collection groupings for contacts
CREATE TABLE IF NOT EXISTS public.card_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- card_leads: the main contacts/CRM table
CREATE TABLE IF NOT EXISTS public.card_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id   UUID REFERENCES public.card_folders(id) ON DELETE SET NULL,
  name        TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  email       TEXT[] NOT NULL DEFAULT '{}',
  phone       TEXT[] NOT NULL DEFAULT '{}',
  "scanDate"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_used  TEXT NOT NULL DEFAULT 'Manual',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.card_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_leads   ENABLE ROW LEVEL SECURITY;

-- card_folders: users only see/touch their own folders
CREATE POLICY "owners can manage their folders"
  ON public.card_folders
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- card_leads: users only see/touch their own leads
CREATE POLICY "owners can manage their leads"
  ON public.card_leads
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_card_leads_owner    ON public.card_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_card_leads_folder   ON public.card_leads(folder_id);
CREATE INDEX IF NOT EXISTS idx_card_folders_owner  ON public.card_folders(owner_id);

-- ── Realtime ─────────────────────────────────────────────────
-- The cards app subscribes to realtime on card_leads.
-- Enable it here:
ALTER PUBLICATION supabase_realtime ADD TABLE public.card_leads;

-- ============================================================
-- Verification: run these to confirm setup
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';
-- ============================================================
