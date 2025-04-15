-- Drop existing foreign keys and indexes
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_id_fkey;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_items_fkey;
DROP INDEX IF EXISTS idx_ratings_media_user;

-- Recreate the relationship with a single clear foreign key
ALTER TABLE ratings ADD CONSTRAINT ratings_media_items_fkey 
  FOREIGN KEY (media_id) 
  REFERENCES media_items(id) 
  ON DELETE CASCADE;

-- Create a single index for performance
CREATE INDEX idx_ratings_media_user ON ratings(media_id, user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;

CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own ratings"
  ON ratings FOR ALL
  USING (auth.uid() = user_id);

-- Add explicit relationship comment for PostgREST
COMMENT ON CONSTRAINT ratings_media_items_fkey ON ratings IS 
  E'@foreignKey (media_id) references media_items (id)\n@manyToOne media_items';
