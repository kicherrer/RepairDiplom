CREATE TABLE IF NOT EXISTS user_media_statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, media_id)
);

ALTER TABLE user_media_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media statuses"
    ON user_media_statuses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media statuses"
    ON user_media_statuses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media statuses"
    ON user_media_statuses FOR UPDATE
    USING (auth.uid() = user_id);
