-- Check if policies exist and create only missing ones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow individual profile viewing'
    ) THEN
        CREATE POLICY "Allow individual profile viewing"
        ON profiles
        FOR SELECT
        USING (
            auth.uid() = id 
            OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND is_admin = true
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON profiles
        FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Allow admin access'
    ) THEN
        CREATE POLICY "Allow admin access"
        ON profiles
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND is_admin = true
            )
        );
    END IF;
END $$;

-- Create user_activities table if not exists
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

-- Enable RLS and add policies only if table was just created
DO $$
BEGIN
    ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_activities'
    ) THEN
        CREATE POLICY "Users can view own activities"
        ON user_activities
        FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own activities"
        ON user_activities
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
