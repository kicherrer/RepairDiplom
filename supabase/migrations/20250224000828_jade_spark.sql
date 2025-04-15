/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text)
      - `bio` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `media_items`
      - `id` (uuid, primary key)
      - `tmdb_id` (integer)
      - `title` (text)
      - `type` (text) - movie, tv, documentary
      - `poster_url` (text)
      - `release_date` (date)
      - `overview` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_media_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `media_item_id` (uuid, references media_items)
      - `status` (text) - watched, watching, plan_to_watch
      - `rating` (integer)
      - `review` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables in correct order
DROP TABLE IF EXISTS user_media_items CASCADE;
DROP TABLE IF EXISTS media_persons CASCADE;
DROP TABLE IF EXISTS media_genres CASCADE;
DROP TABLE IF EXISTS media_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the table with proper schema
CREATE TABLE media_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv')),
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  poster_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create related tables if they don't exist
CREATE TABLE IF NOT EXISTS media_genres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_persons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  character_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create persons table if not exists
CREATE TABLE IF NOT EXISTS persons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_media_items table
CREATE TABLE user_media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_item_id uuid REFERENCES media_items(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('watched', 'watching', 'plan_to_watch')),
  rating integer CHECK (rating >= 1 AND rating <= 10),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, media_item_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Media items are viewable by everyone"
  ON media_items FOR SELECT
  USING (true);

CREATE POLICY "Users can view their media items"
  ON user_media_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their media items"
  ON user_media_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their media items"
  ON user_media_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their media items"
  ON user_media_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add policies for media_items
DROP POLICY IF EXISTS "Media items are viewable by everyone" ON media_items;
DROP POLICY IF EXISTS "Media items can be inserted by everyone" ON media_items;
DROP POLICY IF EXISTS "Media items can be updated by everyone" ON media_items;

CREATE POLICY "Media items are viewable by everyone"
  ON media_items FOR SELECT
  USING (true);

CREATE POLICY "Media items can be inserted by everyone"
  ON media_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Media items can be updated by everyone"
  ON media_items FOR UPDATE
  USING (true);

-- Add policies for persons table
DROP POLICY IF EXISTS "Persons are viewable by everyone" ON persons;
DROP POLICY IF EXISTS "Persons can be inserted by everyone" ON persons;
DROP POLICY IF EXISTS "Persons can be updated by everyone" ON persons;

CREATE POLICY "Persons are viewable by everyone"
  ON persons FOR SELECT
  USING (true);

CREATE POLICY "Persons can be inserted by everyone"
  ON persons FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Persons can be updated by everyone"
  ON persons FOR UPDATE
  USING (true);

-- Add policy for profile viewing
DROP POLICY IF EXISTS "Allow individual profile viewing" ON profiles;
CREATE POLICY "Allow individual profile viewing"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Add policy for admin viewing
DROP POLICY IF EXISTS "Allow admin viewing" ON profiles;
CREATE POLICY "Allow admin viewing"
  ON profiles
  FOR SELECT
  USING (is_admin = true);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_user_media_items_updated_at
  BEFORE UPDATE ON user_media_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();