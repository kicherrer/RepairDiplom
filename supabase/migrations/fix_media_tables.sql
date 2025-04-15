-- Clean up existing tables
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS media_ratings CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;

-- Create media ratings table
CREATE TABLE media_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(media_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user activities table
CREATE TABLE user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('rating', 'comment', 'status_update', 'watch')),
    rating INTEGER,
    status TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE media_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access" ON media_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own ratings" ON media_ratings FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Public read access" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own comments" ON comments FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Public read access" ON user_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own activities" ON user_activities FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_media_ratings_user ON media_ratings(user_id);
CREATE INDEX idx_media_ratings_media ON media_ratings(media_id);
CREATE INDEX idx_comments_media ON comments(media_id);
CREATE INDEX idx_activities_user ON user_activities(user_id);
