-- Pinmark initial schema (PRD §6)

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  public_key text not null unique,               -- 'pk_live_' || nanoid(24), generated app-side
  allowed_domains text[] not null default '{}',  -- supports '*.lovable.app', 'localhost'
  slack_webhook_url text,
  notify_email boolean not null default true,
  created_at timestamptz not null default now()
);

create index on projects (owner_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,  -- null = top-level pin
  route text not null,
  anchor jsonb,                               -- null for replies; anchor object for pins
  author_name text not null check (char_length(author_name) between 1 and 100),
  -- Guest identity. NEVER returned by public (guest-facing) API responses:
  -- the widget tracks its own comment ids in localStorage to know what is "mine".
  author_token uuid not null,
  body text not null check (char_length(body) between 1 and 4000),
  resolved boolean not null default false,    -- only meaningful on top-level
  created_at timestamptz not null default now()
);

create index on comments (project_id, route);
create index on comments (parent_id);

-- Email batching state (PRD §8): at most one email per project per 10 minutes.
create table notification_log (
  project_id uuid primary key references projects(id) on delete cascade,
  last_email_at timestamptz not null default now()
);

-- Row Level Security -------------------------------------------------------
-- Guests never touch Supabase directly; they go through the Next.js API,
-- which uses the service role (bypasses RLS). These policies exist for the
-- authenticated dashboard path only. No anon policies.

alter table projects enable row level security;
alter table comments enable row level security;
alter table notification_log enable row level security;

create policy "owner full access to own projects"
  on projects for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner full access to comments on own projects"
  on comments for all
  to authenticated
  using (
    exists (
      select 1 from projects p
      where p.id = comments.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects p
      where p.id = comments.project_id and p.owner_id = auth.uid()
    )
  );

-- notification_log is service-role only: no policies.
