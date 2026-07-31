-- Let bidders attach photos of the object they're offering, so listing
-- owners can judge offers without relying on the text description alone.

alter table public.offers
  add column if not exists image_urls text[] not null default '{}';

alter table public.offers
  drop column if exists image_url;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  true,
  5242880, -- 5 MB per file
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads are stored under "<user_id>/<filename>" so ownership is derivable
-- from the path alone.
create policy "Offer images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'offer-images');

create policy "Authenticated users can upload their own offer images"
  on storage.objects for insert
  with check (
    bucket_id = 'offer-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own offer images"
  on storage.objects for delete
  using (
    bucket_id = 'offer-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
