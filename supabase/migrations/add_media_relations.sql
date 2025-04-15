-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(media_id, user_id)
);

-- Create media_views table
CREATE TABLE IF NOT EXISTS media_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_views ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Ratings are viewable by everyone"
    ON ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can rate media"
    ON ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their ratings"
    ON ratings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Media views are viewable by everyone"
    ON media_views FOR SELECT
    USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_media_id ON ratings(media_id);
CREATE INDEX IF NOT EXISTS idx_media_views_media_id ON media_views(media_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
