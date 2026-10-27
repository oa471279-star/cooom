-- =============================================================================
-- Balance — Supabase schema, Row Level Security and trusted audit logging
-- Run the whole file once in: Supabase Dashboard → SQL Editor → New query.
-- The script is idempotent: it can be re-run safely.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLES
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  display_name  text not null default '' check (char_length(display_name) <= 60),
  role          text not null default 'user' check (role in ('user', 'admin')),
  savings_goal  numeric(14,2) check (savings_goal is null or savings_goal >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type         text not null check (type in ('income', 'expense')),
  amount       numeric(14,2) not null check (amount > 0 and amount < 1000000000),
  category     text not null check (category in (
                 'food','transport','housing','education','entertainment',
                 'health','small','allowance','extra_income','other')),
  description  text not null default '' check (char_length(description) <= 200),
  tx_date      date not null default current_date,
  created_at   timestamptz not null default now()
);

create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category    text not null check (category in (
                'total','food','transport','housing','education',
                'entertainment','health','small','other')),
  amount      numeric(14,2) not null check (amount > 0 and amount < 1000000000),
  created_at  timestamptz not null default now(),
  unique (user_id, category)
);

create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  notes         text not null default '' check (char_length(notes) <= 500),
  category      text not null default 'study' check (category in ('study','university','work','personal')),
  priority      text not null default 'medium' check (priority in ('low','medium','high')),
  due_date      date,
  is_done       boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject         text not null check (char_length(subject) between 1 and 80),
  target_minutes  integer not null default 0 check (target_minutes between 0 and 1440),
  actual_minutes  integer not null default 0 check (actual_minutes between 0 and 1440),
  session_date    date not null default current_date,
  created_at      timestamptz not null default now()
);

create table if not exists public.daily_plan (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_date   date not null default current_date,
  start_time  time not null,
  end_time    time,
  title       text not null check (char_length(title) between 1 and 120),
  is_done     boolean not null default false,
  created_at  timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);

create table if not exists public.activity_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  email       text,                                   -- snapshot, survives account deletion
  event_type  text not null check (event_type in ('signup', 'login', 'logout')),
  source      text not null check (source in ('server', 'client')),
  details     jsonb not null default '{}'::jsonb,     -- never store tokens or passwords here
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. INDEXES
-- -----------------------------------------------------------------------------
create index if not exists idx_transactions_user_date on public.transactions (user_id, tx_date desc);
create index if not exists idx_transactions_user_type on public.transactions (user_id, type);
create index if not exists idx_tasks_user_due         on public.tasks (user_id, due_date);
create index if not exists idx_study_user_date        on public.study_sessions (user_id, session_date desc);
create index if not exists idx_daily_user_date        on public.daily_plan (user_id, plan_date, start_time);
create index if not exists idx_activity_created       on public.activity_logs (created_at desc);
create index if not exists idx_activity_user          on public.activity_logs (user_id);
create index if not exists idx_activity_type          on public.activity_logs (event_type);

-- -----------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Is the calling user an admin? SECURITY DEFINER avoids RLS recursion on profiles.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Blocks any API-level attempt to change protected profile columns (e.g. role).
-- When you run SQL in the dashboard there is no JWT (auth.uid() is null), so a
-- trusted administrator can still promote users from the SQL Editor.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at then
      raise exception 'Protected profile columns cannot be changed from the client'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- -----------------------------------------------------------------------------
-- 4. TRUSTED (SERVER-SIDE) AUDIT EVENTS
--    These triggers run inside the database, so the client cannot forge them.
-- -----------------------------------------------------------------------------

-- New auth user → create profile + log "signup".
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(left(new.raw_user_meta_data ->> 'display_name', 60), ''))
  on conflict (id) do nothing;

  insert into public.activity_logs (user_id, email, event_type, source, details)
  values (new.id, new.email, 'signup', 'server',
          jsonb_build_object('provider', coalesce(new.raw_app_meta_data ->> 'provider', 'email')));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Supabase Auth updates auth.users.last_sign_in_at on every successful sign-in
-- → log "login". (A password-recovery link also counts as a sign-in.)
create or replace function public.log_user_login()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.last_sign_in_at is not null
     and new.last_sign_in_at is distinct from old.last_sign_in_at then
    insert into public.activity_logs (user_id, email, event_type, source, details)
    values (new.id, new.email, 'login', 'server',
            jsonb_build_object('provider', coalesce(new.raw_app_meta_data ->> 'provider', 'email')));
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_login on auth.users;
create trigger on_auth_user_login
  after update of last_sign_in_at on auth.users
  for each row execute function public.log_user_login();

-- Logout can only be *reported* by the browser. It is stored with source='client'
-- and labelled as such in the admin dashboard. Only 'logout' is accepted, only for
-- the caller's own identity, and rapid repeats are ignored.
create or replace function public.log_client_event(p_event text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
begin
  if auth.uid() is null then return; end if;
  if p_event is distinct from 'logout' then
    raise exception 'Unsupported client event' using errcode = '22023';
  end if;
  if exists (select 1 from public.activity_logs l
             where l.user_id = auth.uid() and l.event_type = 'logout'
               and l.created_at > now() - interval '5 seconds') then
    return;
  end if;
  select p.email into v_email from public.profiles p where p.id = auth.uid();
  insert into public.activity_logs (user_id, email, event_type, source, details)
  values (auth.uid(), v_email, 'logout', 'client',
          jsonb_build_object('note', 'client-reported logout request'));
end;
$$;
revoke all on function public.log_client_event(text, jsonb) from public, anon;
grant execute on function public.log_client_event(text, jsonb) to authenticated;

-- Admin user overview. Returns COUNTS only — never amounts, categories or task text.
create or replace function public.admin_user_summary()
returns table (
  id uuid, email text, display_name text, role text, created_at timestamptz,
  last_sign_in_at timestamptz, login_count bigint, transaction_count bigint, task_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.display_name, p.role, p.created_at, u.last_sign_in_at,
           (select count(*) from public.activity_logs l where l.user_id = p.id and l.event_type = 'login'),
           (select count(*) from public.transactions t where t.user_id = p.id),
           (select count(*) from public.tasks k where k.user_id = p.id)
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;
revoke all on function public.admin_user_summary() from public, anon;
grant execute on function public.admin_user_summary() to authenticated;

-- Back-fill profiles for any users created before this script was run.
insert into public.profiles (id, email, display_name)
select u.id, u.email, coalesce(left(u.raw_user_meta_data ->> 'display_name', 60), '')
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.transactions   enable row level security;
alter table public.budgets        enable row level security;
alter table public.tasks          enable row level security;
alter table public.study_sessions enable row level security;
alter table public.daily_plan     enable row level security;
alter table public.activity_logs  enable row level security;

-- Anonymous visitors get no table access at all.
revoke all on all tables in schema public from anon;
-- Logs are append-only via trusted functions; nobody edits them through the API.
revoke insert, update, delete on public.activity_logs from authenticated;
-- Profiles are created only by the signup trigger and are never deleted via the API.
revoke insert, delete on public.profiles from authenticated;

-- profiles: users see/edit their own row; admins can read all rows (no financial data here).
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;
create policy profiles_select_own   on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select to authenticated using (public.is_admin());
create policy profiles_update_own   on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Private data tables: owner only. There is deliberately NO admin policy here —
-- being an admin does not grant access to anyone's finances, tasks or schedule.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['transactions','budgets','tasks','study_sessions','daily_plan'] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_owner_all', tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      tbl || '_owner_all', tbl);
  end loop;
end;
$$;

-- activity_logs: readable by admins only.
drop policy if exists activity_logs_select_admin on public.activity_logs;
create policy activity_logs_select_admin on public.activity_logs
  for select to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. PROMOTING THE FIRST ADMINISTRATOR  (do this manually, once)
-- -----------------------------------------------------------------------------
-- 1) Register normally in the app with the email you want to be the admin.
-- 2) In the SQL Editor (which runs as a trusted role, not through the API) run:
--
--    update public.profiles
--       set role = 'admin'
--     where email = 'your-email@example.com';
--
-- Replace the address with your own. No credentials are stored in this file, and
-- the protect_profile_columns trigger stops any browser request from doing this.
-- To demote: set role = 'user' the same way.
