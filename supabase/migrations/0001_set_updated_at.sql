-- Maintain updated_at automatically on tables that have the column.
--
-- The app ALSO sets updated_at explicitly on every update, so it works even if
-- this migration has not been applied. Applying this trigger makes the value
-- correct for any write path (SQL editor, other clients, future code).
--
-- Run this in the Supabase dashboard → SQL Editor, or with `supabase db push`
-- if the project is linked to the CLI. It is idempotent and safe to re-run.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.tasks;
create trigger set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
