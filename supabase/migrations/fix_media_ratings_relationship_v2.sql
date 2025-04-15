-- Drop existing foreign keys and indices
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_id_fkey CASCADE;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_items_fkey CASCADE;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_media_id_user_id_key CASCADE;

-- Drop and recreate ratings table to ensure clean state
DROP TABLE IF EXISTS ratings CASCADE;
CREATE TABLE ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(media_id, user_id)
);

-- Add indices
CREATE INDEX idx_ratings_media_id ON ratings(media_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);

-- Set up RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Ratings are viewable by everyone"
    ON ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own ratings"
    ON ratings FOR ALL
    USING (auth.uid() = user_id);
