-- Добавляем каскадное удаление для всех связанных таблиц
DROP POLICY IF EXISTS "Media items can be deleted by everyone" ON media_items;

CREATE POLICY "Media items can be deleted by everyone" 
  ON media_items FOR DELETE 
  USING (true);

-- Очищаем существующие ограничения
ALTER TABLE IF EXISTS media_persons DROP CONSTRAINT IF EXISTS media_persons_media_id_fkey;
ALTER TABLE IF EXISTS media_views DROP CONSTRAINT IF EXISTS media_views_media_id_fkey;
ALTER TABLE IF EXISTS media_genres DROP CONSTRAINT IF EXISTS media_genres_media_id_fkey;

-- Добавляем новые ограничения с каскадным удалением
ALTER TABLE media_persons ADD CONSTRAINT media_persons_media_id_fkey 
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE;

ALTER TABLE media_views ADD CONSTRAINT media_views_media_id_fkey 
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE;

ALTER TABLE media_genres ADD CONSTRAINT media_genres_media_id_fkey 
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE;
