-- Проверьте, что структура таблицы соответствует этой:
CREATE TABLE IF NOT EXISTS media_items (
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
