-- Form Memory: hosted knowledge graph (personal brain now, multi-tenant later)

create extension if not exists "pgcrypto";

-- Workspaces = tenants. One personal workspace seeded below.
create table public.form_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_personal boolean not null default false,
  created_at timestamptz not null default now()
);

-- Entities in the knowledge graph
create table public.form_entities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.form_workspaces(id) on delete cascade,
  name text not null,
  entity_type text not null default 'concept',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint form_entities_workspace_name_unique unique (workspace_id, name)
);

create index form_entities_workspace_id_idx on public.form_entities(workspace_id);
create index form_entities_entity_type_idx on public.form_entities(entity_type);

-- Observations attached to entities
create table public.form_observations (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.form_entities(id) on delete cascade,
  content text not null,
  source text,
  created_at timestamptz not null default now()
);

create index form_observations_entity_id_idx on public.form_observations(entity_id);
create index form_observations_created_at_idx on public.form_observations(created_at desc);

-- Relations between entities (active voice: "Don" -> "prefers" -> "concise Slack tone")
create table public.form_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.form_workspaces(id) on delete cascade,
  from_entity_id uuid not null references public.form_entities(id) on delete cascade,
  to_entity_id uuid not null references public.form_entities(id) on delete cascade,
  relation_type text not null,
  created_at timestamptz not null default now(),
  constraint form_relations_unique unique (
    workspace_id,
    from_entity_id,
    to_entity_id,
    relation_type
  )
);

create index form_relations_workspace_id_idx on public.form_relations(workspace_id);

-- Platform API keys (wispr, cursor, brand-studio) — multi-tenant routing later
create table public.form_platform_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.form_workspaces(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null,
  platform text not null,
  label text,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint form_platform_keys_prefix_unique unique (key_prefix)
);

create index form_platform_keys_workspace_id_idx on public.form_platform_keys(workspace_id);

-- updated_at trigger
create or replace function public.form_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger form_entities_updated_at
  before update on public.form_entities
  for each row execute function public.form_touch_updated_at();

-- RLS enabled; Edge Function uses service role. User JWT access comes in Phase 2.
alter table public.form_workspaces enable row level security;
alter table public.form_entities enable row level security;
alter table public.form_observations enable row level security;
alter table public.form_relations enable row level security;
alter table public.form_platform_keys enable row level security;

-- Personal brain workspace (stable id for seeds + docs)
insert into public.form_workspaces (id, slug, name, is_personal)
values (
  '00000000-0000-4000-8000-000000000001',
  'personal',
  'Don — Personal Brain',
  true
);

-- Seed entities for cross-platform context
insert into public.form_entities (workspace_id, name, entity_type) values
  ('00000000-0000-4000-8000-000000000001', 'Don', 'person'),
  ('00000000-0000-4000-8000-000000000001', 'Brand Studio', 'project'),
  ('00000000-0000-4000-8000-000000000001', 'Form Platforms', 'organization'),
  ('00000000-0000-4000-8000-000000000001', 'Voice Preferences', 'preference_set');

insert into public.form_observations (entity_id, content, source)
select e.id, o.content, 'seed'
from public.form_entities e
cross join lateral (
  values
    ('Don', 'Southern US accent; speaks quickly with occasional drawl.'),
    ('Don', 'Building Form platforms: wispr-clone, quiver-clone, relume-clone, Brand Studio.'),
    ('Don', 'Prefers owned infrastructure over subscriptions where practical.'),
    ('Brand Studio', 'Skills-based brand system with church vertical and Quiver-compatible SVG API.'),
    ('Form Platforms', 'Shared memory across all Form tools via form-memory on Supabase.'),
    ('Voice Preferences', 'Preserve intentional Southern phrasing; do not over-correct dialect.'),
    ('Voice Preferences', 'Remove filler words and apply self-corrections in polish layer.')
) as o(entity_name, content)
where e.workspace_id = '00000000-0000-4000-8000-000000000001'
  and e.name = o.entity_name;
