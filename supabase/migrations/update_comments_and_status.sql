-- Обновляем политики для существующей таблицы comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- Добавляем индекс для ускорения запросов
CREATE INDEX IF NOT EXISTS comments_media_id_idx ON comments(media_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
