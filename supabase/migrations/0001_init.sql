-- SwapBid schema: reverse marketplace
-- Someone posts money they have ("Gesuch"), others offer an object for it ("Angebot").

create extension if not exists "pgcrypto";

-- Profiles -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Listings ("Ich habe X€ übrig") ---------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  amount numeric(10, 2) not null check (amount > 0),
  category text not null default 'sonstiges',
  status text not null default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select
  using (true);

create policy "Authenticated users can create listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "Owners can update their own listings"
  on public.listings for update
  using (auth.uid() = user_id);

create policy "Owners can delete their own listings"
  on public.listings for delete
  using (auth.uid() = user_id);

-- Offers ("Für die 20€ biete ich dir Objekt XYZ") -----------------------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "Offers are viewable by everyone"
  on public.offers for select
  using (true);

create policy "Authenticated users can create offers"
  on public.offers for insert
  with check (auth.uid() = user_id);

create policy "Offer owners can update or withdraw a pending offer"
  on public.offers for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

create policy "Listing owners can accept or reject offers"
  on public.offers for update
  using (
    auth.uid() = (select user_id from public.listings where id = listing_id)
  );

create policy "Offer owners can delete their pending offer"
  on public.offers for delete
  using (auth.uid() = user_id and status = 'pending');

create index if not exists offers_listing_id_idx on public.offers (listing_id);
create index if not exists listings_status_idx on public.listings (status);
