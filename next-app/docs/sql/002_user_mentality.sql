create table if not exists public.user_mentality (
  user_id uuid primary key references auth.users(id) on delete cascade,
  relationship_intent text,
  selected_track text,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_mentality_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_mentality_set_updated_at on public.user_mentality;

create trigger user_mentality_set_updated_at
before update on public.user_mentality
for each row
execute function public.set_user_mentality_updated_at();
