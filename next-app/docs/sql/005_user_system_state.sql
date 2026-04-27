create table public.user_system_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_status text not null default '1-basics',
  tier text not null default 'free',
  promoted_by text,
  report_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_system_state_onboarding_status_check
    check (onboarding_status in ('1-basics', '2-mentality', '3-picture', '4-agent', 'finished')),
  constraint user_system_state_tier_check
    check (tier in ('free', 'paid'))
);

create or replace function public.set_user_system_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_system_state_set_updated_at
before update on public.user_system_state
for each row
execute function public.set_user_system_state_updated_at();

create or replace function public.handle_new_user_system_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_system_state (user_id, onboarding_status, tier, promoted_by, report_flags)
  values (new.id, '1-basics', 'free', null, '{}')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_user_system_state
after insert on auth.users
for each row
execute function public.handle_new_user_system_state();

alter table public.user_system_state enable row level security;

create policy "Users can read their own system state"
on public.user_system_state
for select
to authenticated
using (auth.uid() = user_id);
