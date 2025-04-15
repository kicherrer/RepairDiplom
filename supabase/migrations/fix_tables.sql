-- Remove existing constraints from ratings table
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_pkey;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_user_fkey;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_fkey;

-- Add new constraints to ratings table
ALTER TABLE ratings ADD CONSTRAINT ratings_pkey PRIMARY KEY (user_id, media_id);
ALTER TABLE ratings ADD CONSTRAINT ratings_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE ratings ADD CONSTRAINT ratings_media_fkey FOREIGN KEY (media_id) REFERENCES media_items(id);

-- Fix comments table
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_media_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE comments ADD CONSTRAINT comments_media_fkey FOREIGN KEY (media_id) REFERENCES media_items(id);
