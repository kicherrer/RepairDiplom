-- Fix ratings relationships
DROP POLICY IF EXISTS "Enable read access for all users" ON ratings;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON ratings;

-- Clear any existing policies and enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own ratings"
  ON ratings FOR ALL
  USING (auth.uid() = user_id);

-- Add explicit relationship between media_items and ratings
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_id_fkey;
ALTER TABLE ratings ADD CONSTRAINT ratings_media_id_fkey 
  FOREIGN KEY (media_id) 
  REFERENCES media_items(id) 
  ON DELETE CASCADE;

-- Create index to improve query performance
CREATE INDEX IF NOT EXISTS idx_ratings_media_user 
  ON ratings(media_id, user_id);
