-- Trust & safety baseline: a report queue for users to flag listings/offers,
-- and a coarse server-side keyword filter blocking obviously prohibited
-- content (sexual services, trafficking/exploitation, weapons, drugs, ...)
-- on insert/update. Neither of these is a substitute for the operator
-- actively reviewing reports and, for suspected serious crimes, involving
-- law enforcement — see README.md.

-- Reports ------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('listing', 'offer')),
  target_id uuid not null,
  reason text not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- Keyword filter -------------------------------------------------------------
-- Not exposed via the API — only readable by the security-definer function
-- below, so the blocklist itself can't be scraped through the anon/authenticated
-- REST role to help evade it.
create table if not exists public.blocked_terms (
  term text primary key
);

revoke all on public.blocked_terms from anon, authenticated;

insert into public.blocked_terms (term) values
  ('sex'), ('porn'), ('pornographie'), ('escort'), ('prostitution'), ('erotik'),
  ('blowjob'), ('handjob'), ('blowi'),
  ('menschenhandel'), ('sklave'), ('sklavin'), ('zwangsarbeit'), ('ausbeutung'),
  ('minderjährig'), ('kinderporno'),
  ('waffe'), ('schusswaffe'), ('munition'),
  ('drogen'), ('kokain'), ('heroin'), ('crystal meth'), ('betäubungsmittel'),
  ('falschgeld'), ('gestohlen')
on conflict (term) do nothing;

create or replace function public.contains_blocked_term(input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_terms
    where input ilike '%' || term || '%'
  );
$$;

-- Emoji combos used as sexual innuendo (e.g. eggplant + tongue) are checked
-- separately: any single one of these is common in innocent contexts
-- (cooking, food posts), so only flag when at least two distinct ones show
-- up anywhere in the same text — not necessarily adjacent, since spacing
-- them out is a trivial evasion of a plain substring match.
create table if not exists public.blocked_emoji (
  emoji text primary key
);

revoke all on public.blocked_emoji from anon, authenticated;

insert into public.blocked_emoji (emoji) values
  ('🍆'), ('👅'), ('🍑'), ('💦')
on conflict (emoji) do nothing;

create or replace function public.contains_blocked_emoji_combo(input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) >= 2
  from public.blocked_emoji
  where position(emoji in input) > 0;
$$;

create or replace function public.check_listing_content()
returns trigger
language plpgsql
as $$
begin
  if public.contains_blocked_term(new.title)
    or public.contains_blocked_term(new.description)
    or public.contains_blocked_emoji_combo(new.title)
    or public.contains_blocked_emoji_combo(new.description)
  then
    raise exception 'Dieser Inhalt verstößt gegen die Nutzungsbedingungen von SwapBid.';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_content_check on public.listings;
create trigger listings_content_check
  before insert or update on public.listings
  for each row execute procedure public.check_listing_content();

create or replace function public.check_offer_content()
returns trigger
language plpgsql
as $$
begin
  if public.contains_blocked_term(new.title)
    or public.contains_blocked_term(new.description)
    or public.contains_blocked_emoji_combo(new.title)
    or public.contains_blocked_emoji_combo(new.description)
  then
    raise exception 'Dieser Inhalt verstößt gegen die Nutzungsbedingungen von SwapBid.';
  end if;
  return new;
end;
$$;

drop trigger if exists offers_content_check on public.offers;
create trigger offers_content_check
  before insert or update on public.offers
  for each row execute procedure public.check_offer_content();
