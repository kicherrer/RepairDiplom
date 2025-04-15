-- Reset existing policies
DROP POLICY IF EXISTS "Allow public read from media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert to media bucket" ON storage.objects;

-- Create more permissive policies
CREATE POLICY "Allow public access to media bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Ensure buckets are properly configured
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif']
WHERE id = 'media';
