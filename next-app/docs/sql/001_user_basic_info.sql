create table if not exists public.user_basic_info (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age integer,
  phone_number text,
  preferred_age_min integer,
  preferred_age_max integer,
  gender_identity text,
  gender_identity_custom text,
  interested_in text,
  interested_in_custom text,
  ethnicity text,
  preferred_ethnicities text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_basic_info_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_basic_info_set_updated_at on public.user_basic_info;

create trigger user_basic_info_set_updated_at
before update on public.user_basic_info
for each row
execute function public.set_user_basic_info_updated_at();
