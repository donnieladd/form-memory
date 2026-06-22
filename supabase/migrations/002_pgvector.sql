-- Semantic search layer (Phase 2). Safe to apply now; embedding backfill comes later.

create extension if not exists vector with schema extensions;

create table public.form_observation_embeddings (
  observation_id uuid primary key references public.form_observations(id) on delete cascade,
  embedding extensions.vector(1536),
  model text not null default 'text-embedding-3-small',
  created_at timestamptz not null default now()
);

alter table public.form_observation_embeddings enable row level security;

-- Create ivfflat index after embeddings are backfilled:
-- create index ... using ivfflat (embedding vector_cosine_ops) with (lists = 100);
