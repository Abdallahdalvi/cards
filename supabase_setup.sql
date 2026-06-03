-- STEP 1: CREATE STANDARD USER STRUCTURE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamp default now()
);

-- STEP 2: AUTO PROFILE CREATION
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STEP 3: ENABLE SECURITY (RLS)
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- CLEANUP: Remove custom auth table if it exists
-- drop table if exists public.cards_auth;

-- Ensure other tables have RLS and proper owner_id checks
alter table public.card_folders enable row level security;
drop policy if exists "Users can manage their own folders" on public.card_folders;
create policy "Users can manage their own folders"
  on public.card_folders for all
  using (auth.uid() = owner_id);

alter table public.card_leads enable row level security;
drop policy if exists "Users can manage their own leads" on public.card_leads;
create policy "Users can manage their own leads"
  on public.card_leads for all
  using (auth.uid() = owner_id);

-- STEP 4: ALTER TABLE TO ADD NOTES COLUMN
alter table public.card_leads add column if not exists notes text;
