-- Drop all related tables and constraints
DROP TABLE IF EXISTS user_media_statuses CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;

-- Recreate ratings table
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
    CONSTRAINT ratings_unique 
        UNIQUE(media_id, user_id)
);

-- Recreate comments table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    media_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comments_media_id_fkey 
        FOREIGN KEY (media_id) 
        REFERENCES media_items(id) 
        ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Recreate user_media_statuses table
CREATE TABLE user_media_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    media_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('watching', 'plan_to_watch', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_media_statuses_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT user_media_statuses_media_id_fkey 
        FOREIGN KEY (media_id) 
        REFERENCES media_items(id) 
        ON DELETE CASCADE,
    CONSTRAINT user_media_status_unique 
        UNIQUE(user_id, media_id)
);

-- Create explicit relationships for PostgREST
COMMENT ON CONSTRAINT ratings_media_id_fkey ON ratings IS 
  '@foreignKey (media_id) references media_items(id)
   @manyToOne media_items';

COMMENT ON CONSTRAINT comments_media_id_fkey ON comments IS 
  '@foreignKey (media_id) references media_items(id)
   @manyToOne media_items';

COMMENT ON CONSTRAINT user_media_statuses_media_id_fkey ON user_media_statuses IS 
  '@foreignKey (media_id) references media_items(id)
   @manyToOne media_items';

-- Create indices
CREATE INDEX idx_ratings_media_user ON ratings(media_id, user_id);
CREATE INDEX idx_comments_media_user ON comments(media_id, user_id);
CREATE INDEX idx_statuses_media_user ON user_media_statuses(media_id, user_id);

-- Enable RLS on all tables
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media_statuses ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies
CREATE POLICY "Ratings are viewable by everyone" 
    ON ratings FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own ratings" 
    ON ratings FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" 
    ON comments FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own comments" 
    ON comments FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Statuses are viewable by everyone" 
    ON user_media_statuses FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own statuses" 
    ON user_media_statuses FOR ALL 
    USING (auth.uid() = user_id);
