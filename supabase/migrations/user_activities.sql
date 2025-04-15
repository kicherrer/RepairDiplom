CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  status TEXT,
  rating INTEGER,
  content TEXT,
  media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own activities"
  ON user_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON user_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
