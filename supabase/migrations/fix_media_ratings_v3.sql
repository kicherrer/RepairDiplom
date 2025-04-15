-- Сначала удалим все существующие отношения
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS media_ratings CASCADE;

-- Создаем таблицу ratings заново с четким именованием
CREATE TABLE media_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT media_ratings_media_id_fkey 
        FOREIGN KEY (media_id) 
        REFERENCES media_items(id) 
        ON DELETE CASCADE,
    CONSTRAINT media_ratings_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT media_ratings_unique 
        UNIQUE(media_id, user_id)
);

-- Добавляем явный комментарий для PostgREST
COMMENT ON TABLE media_ratings IS 'User ratings for media items';
COMMENT ON CONSTRAINT media_ratings_media_id_fkey ON media_ratings IS 
  '@foreignKey (media_id) references media_items(id)
   @manyToOne media_items
   @name ratings';

-- Создаем индекс
CREATE INDEX idx_media_ratings_media_user ON media_ratings(media_id, user_id);

-- Настраиваем RLS
ALTER TABLE media_ratings ENABLE ROW LEVEL SECURITY;

-- Добавляем политики
CREATE POLICY "Media ratings are viewable by everyone"
    ON media_ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own ratings"
    ON media_ratings FOR ALL
    USING (auth.uid() = user_id);
