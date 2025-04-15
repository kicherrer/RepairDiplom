-- Убедимся, что бакет существует и публичный
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Удаляем старые политики, если они существуют
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to media folder" ON storage.objects;

-- Создаем новые политики для storage.objects
-- Разрешаем всем читать из бакета media
CREATE POLICY "Allow public read from media bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Разрешаем всем загружать в бакет media
CREATE POLICY "Allow public insert to media bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

-- Разрешаем всем обновлять файлы в бакете media
CREATE POLICY "Allow public update in media bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media');

-- Разрешаем всем удалять файлы из бакета media
CREATE POLICY "Allow public delete from media bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');

-- Включаем RLS для storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
