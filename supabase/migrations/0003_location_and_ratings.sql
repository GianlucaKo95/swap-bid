-- Location on listings (for filtering by "Umgebung") and mutual ratings
-- between the two participants of a completed swap.

alter table public.listings
  add column if not exists location text not null default '';

create index if not exists listings_location_idx on public.listings using gin (to_tsvector('simple', location));

-- Ratings ----------------------------------------------------------------
-- After a listing is matched, the listing owner and the bidder whose offer
-- was accepted may each rate the other once.
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  ratee_id uuid not null references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (listing_id, rater_id)
);

alter table public.ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Matched participants can rate each other once"
  on public.ratings for insert
  with check (
    auth.uid() = rater_id
    and rater_id <> ratee_id
    and exists (
      select 1
      from public.listings l
      join public.offers o on o.listing_id = l.id and o.status = 'accepted'
      where l.id = listing_id
        and l.status = 'matched'
        and (
          (auth.uid() = l.user_id and ratee_id = o.user_id)
          or (auth.uid() = o.user_id and ratee_id = l.user_id)
        )
    )
  );

create index if not exists ratings_ratee_id_idx on public.ratings (ratee_id);

-- Convenience view: average rating + count per user.
create or replace view public.user_rating_summary as
select
  ratee_id as user_id,
  round(avg(stars)::numeric, 1) as avg_stars,
  count(*) as rating_count
from public.ratings
group by ratee_id;

grant select on public.user_rating_summary to anon, authenticated;
