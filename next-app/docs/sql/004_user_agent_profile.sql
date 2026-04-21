create table if not exists public.user_agent_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criteria jsonb not null default '[]'::jsonb,
  final_summary text,
  agent_memory jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_agent_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_agent_profile_set_updated_at on public.user_agent_profile;

create trigger user_agent_profile_set_updated_at
before update on public.user_agent_profile
for each row
execute function public.set_user_agent_profile_updated_at();
