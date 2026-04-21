create table if not exists public.user_matches_info (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age integer,
  gender_identity text,
  interested_in text,
  ethnicity text,
  relationship_intent text,
  mentality_summary text,
  agent_summary text,
  profile_picture_path text,
  visible_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_matches_info_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_matches_info_set_updated_at on public.user_matches_info;

create trigger user_matches_info_set_updated_at
before update on public.user_matches_info
for each row
execute function public.set_user_matches_info_updated_at();
