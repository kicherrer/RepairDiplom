-- Обновляем таблицу ratings (во множественном числе)
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
    ON ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own ratings"
    ON ratings FOR ALL
    USING (auth.uid() = user_id);

-- Создаем индексы для ratings
CREATE INDEX IF NOT EXISTS idx_ratings_media_id ON ratings(media_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- Обновляем комментарии
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON comments(media_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
