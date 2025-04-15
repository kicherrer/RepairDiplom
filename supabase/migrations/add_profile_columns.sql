-- Add new columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'banner_url') THEN
        ALTER TABLE profiles ADD COLUMN banner_url TEXT;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'animation') THEN
        ALTER TABLE profiles ADD COLUMN animation TEXT;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE profiles ADD COLUMN display_name TEXT;
        -- Update existing profiles to set display_name same as username
        UPDATE profiles SET display_name = username WHERE display_name IS NULL;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'public_profile') THEN
        ALTER TABLE profiles ADD COLUMN public_profile BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'show_activity') THEN
        ALTER TABLE profiles ADD COLUMN show_activity BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'show_stats') THEN
        ALTER TABLE profiles ADD COLUMN show_stats BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'social_links') THEN
        ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'theme') THEN
        ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT 'system';
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'use_gif_avatar') THEN
        ALTER TABLE profiles ADD COLUMN use_gif_avatar BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS(SELECT FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'use_gif_banner') THEN
        ALTER TABLE profiles ADD COLUMN use_gif_banner BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Refresh the schema cache to make new columns available
NOTIFY pgrst, 'reload schema';
