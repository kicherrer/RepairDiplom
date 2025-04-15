-- Пересоздаем внешние ключи с каскадным удалением
ALTER TABLE media_persons 
  DROP CONSTRAINT IF EXISTS media_persons_media_id_fkey,
  ADD CONSTRAINT media_persons_media_id_fkey 
    FOREIGN KEY (media_id) 
    REFERENCES media_items(id) 
    ON DELETE CASCADE;

ALTER TABLE media_views 
  DROP CONSTRAINT IF EXISTS media_views_media_id_fkey,
  ADD CONSTRAINT media_views_media_id_fkey 
    FOREIGN KEY (media_id) 
    REFERENCES media_items(id) 
    ON DELETE CASCADE;

ALTER TABLE media_genres 
  DROP CONSTRAINT IF EXISTS media_genres_media_id_fkey,
  ADD CONSTRAINT media_genres_media_id_fkey 
    FOREIGN KEY (media_id) 
    REFERENCES media_items(id) 
    ON DELETE CASCADE;
