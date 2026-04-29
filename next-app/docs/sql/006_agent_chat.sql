create table if not exists public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  match_id uuid references public.matches(id) on delete cascade,
  title text,
  latest_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  archived_at timestamptz,
  summary text,
  summary_updated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint agent_threads_kind_check
    check (kind in ('general', 'match'))
);

create index if not exists idx_agent_threads_user_updated_at
  on public.agent_threads (user_id, updated_at desc);

create index if not exists idx_agent_threads_user_kind_updated_at
  on public.agent_threads (user_id, kind, updated_at desc);

create unique index if not exists idx_agent_threads_user_match_unique
  on public.agent_threads (user_id, match_id)
  where match_id is not null;

create or replace function public.set_agent_threads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_threads_set_updated_at on public.agent_threads;

create trigger agent_threads_set_updated_at
before update on public.agent_threads
for each row
execute function public.set_agent_threads_updated_at();

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint agent_messages_role_check
    check (role in ('user', 'assistant', 'system')),
  constraint agent_messages_status_check
    check (status in ('pending', 'completed', 'failed'))
);

create index if not exists idx_agent_messages_thread_created_at
  on public.agent_messages (thread_id, created_at asc);

create index if not exists idx_agent_messages_user_created_at
  on public.agent_messages (user_id, created_at desc);

create table if not exists public.agent_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_thread_id uuid references public.agent_threads(id) on delete set null,
  source_message_id uuid references public.agent_messages(id) on delete set null,
  kind text not null,
  content text not null,
  confidence numeric(4,3),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint agent_memories_status_check
    check (status in ('active', 'discarded', 'superseded'))
);

create index if not exists idx_agent_memories_user_status_updated_at
  on public.agent_memories (user_id, status, updated_at desc);

create or replace function public.set_agent_memories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_memories_set_updated_at on public.agent_memories;

create trigger agent_memories_set_updated_at
before update on public.agent_memories
for each row
execute function public.set_agent_memories_updated_at();

alter table public.agent_threads enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_memories enable row level security;

create policy "Users can read their own agent threads"
on public.agent_threads
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own agent threads"
on public.agent_threads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own agent threads"
on public.agent_threads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own agent messages"
on public.agent_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own agent messages"
on public.agent_messages
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own agent messages"
on public.agent_messages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own agent memories"
on public.agent_memories
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own agent memories"
on public.agent_memories
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own agent memories"
on public.agent_memories
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own agent memories"
on public.agent_memories
for delete
to authenticated
using (auth.uid() = user_id);
