-- Run once in your Supabase project's SQL Editor. Safe to run again.
begin;
create table if not exists public.clipboard (
  id smallint primary key default 1 check (id = 1),
  content text not null default '',
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.clipboard (id) values (1) on conflict do nothing;
alter table public.clipboard enable row level security;
drop policy if exists "Anyone can read the clipboard" on public.clipboard;
create policy "Anyone can read the clipboard" on public.clipboard for select to anon, authenticated using (id = 1);
revoke all on public.clipboard from anon, authenticated;
grant select on public.clipboard to anon, authenticated;

-- Atomic writes keep revisions ordered across simultaneous visitors.
create or replace function public.write_clipboard(new_content text)
returns setof public.clipboard
language sql security definer set search_path = '' as $$
  update public.clipboard
  set content = new_content, revision = revision + 1, updated_at = clock_timestamp()
  where id = 1
  returning *;
$$;
revoke all on function public.write_clipboard(text) from public;
grant execute on function public.write_clipboard(text) to anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clipboard') then
    alter publication supabase_realtime add table public.clipboard;
  end if;
end $$;
commit;
