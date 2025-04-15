-- Drop existing relationships and table
DROP TABLE IF EXISTS ratings CASCADE;
DROP TYPE IF EXISTS rating_type CASCADE;

-- Create new ratings table
CREATE TABLE ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ratings_media_id_fkey 
        FOREIGN KEY (media_id) 
        REFERENCES media_items(id) 
        ON DELETE CASCADE,
    CONSTRAINT ratings_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT media_user_rating_unique 
        UNIQUE(media_id, user_id)
);

-- Add comment to explicitly define relationship
COMMENT ON CONSTRAINT ratings_media_id_fkey ON ratings IS 
  '@foreignKey (media_id) references media_items(id)
   @manyToOne media_items';

-- Create indices
CREATE INDEX ON ratings (media_id);
CREATE INDEX ON ratings (user_id);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;

-- Create new policies
CREATE POLICY "Ratings are viewable by everyone" 
    ON ratings FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own ratings" 
    ON ratings FOR ALL 
    USING (auth.uid() = user_id);
