-- Closes the client-side bypass of the NSFW image check: uploads to the
-- offer-images bucket must now go through the moderate-offer-image Edge
-- Function (which uses the service role key and therefore isn't subject to
-- this policy), so there is no path left for a client to write to this
-- bucket directly — not even by calling the Storage REST API by hand.
drop policy if exists "Authenticated users can upload their own offer images" on storage.objects;
