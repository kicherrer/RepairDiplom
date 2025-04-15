-- Check and drop existing policies if they exist
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
DROP POLICY IF EXISTS "Enable read access for all users" ON ratings;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON ratings;

-- Make sure RLS is enabled
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Add new policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ratings' AND policyname = 'Ratings are viewable by everyone'
  ) THEN
    CREATE POLICY "Ratings are viewable by everyone"
      ON ratings FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ratings' AND policyname = 'Users can manage their own ratings'
  ) THEN
    CREATE POLICY "Users can manage their own ratings"
      ON ratings FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update foreign key constraint
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_id_fkey;
ALTER TABLE ratings ADD CONSTRAINT ratings_media_id_fkey 
  FOREIGN KEY (media_id) 
  REFERENCES media_items(id) 
  ON DELETE CASCADE;

-- Create or replace index
DROP INDEX IF EXISTS idx_ratings_media_user;
CREATE INDEX idx_ratings_media_user ON ratings(media_id, user_id);
