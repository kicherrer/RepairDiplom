-- Drop tables and triggers if they exist
DROP TRIGGER IF EXISTS on_media_item_created ON media_items;
DROP FUNCTION IF EXISTS handle_new_media_item();
DROP TABLE IF EXISTS media_views CASCADE;

-- Create media_views table with correct column name
CREATE TABLE IF NOT EXISTS media_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle media item creation
CREATE OR REPLACE FUNCTION handle_new_media_item()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO media_views (media_id, view_count)
    VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new media items
CREATE TRIGGER on_media_item_created
    AFTER INSERT ON media_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_media_item();

-- Add existing media items to media_views
INSERT INTO media_views (media_id, view_count)
SELECT id, 0
FROM media_items mi
WHERE NOT EXISTS (
    SELECT 1 FROM media_views mv WHERE mv.media_id = mi.id
);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
