-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow individual profile viewing" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admin access" ON profiles;

-- Create simplified policies without recursion
CREATE POLICY "Allow individual profile viewing"
  ON profiles
  FOR SELECT
  USING (true);  -- Allow all users to view profiles

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Add reference to media_items in user_activities
ALTER TABLE user_activities 
  ADD CONSTRAINT fk_media_items 
  FOREIGN KEY (media_id) 
  REFERENCES media_items(id) 
  ON DELETE CASCADE;

-- Create index to improve performance
CREATE INDEX IF NOT EXISTS idx_user_activities_media_id 
  ON user_activities(media_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
