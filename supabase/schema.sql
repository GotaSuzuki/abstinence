create table if not exists public.abstinence_days (
  day date primary key,
  success boolean not null,
  recorded_at timestamptz not null default now()
);

alter table public.abstinence_days enable row level security;

drop policy if exists "Users can read their days" on public.abstinence_days;
drop policy if exists "Users can insert their days" on public.abstinence_days;
drop policy if exists "Users can update their days" on public.abstinence_days;

create policy "Public read abstinence days"
  on public.abstinence_days
  for select
  using (true);

create policy "Public insert abstinence days"
  on public.abstinence_days
  for insert
  with check (true);

create policy "Public update abstinence days"
  on public.abstinence_days
  for update
  using (true)
  with check (true);
