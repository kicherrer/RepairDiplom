-- Создаем/обновляем таблицу комментариев
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Создаем/обновляем таблицу статусов просмотра
CREATE TABLE IF NOT EXISTS public.user_media_statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('watching', 'plan_to_watch', 'completed')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, media_id)
);

-- Добавляем политики для комментариев
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Добавляем политики для статусов просмотра
ALTER TABLE public.user_media_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status viewable by everyone"
    ON public.user_media_statuses FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own status"
    ON public.user_media_statuses FOR ALL
    USING (auth.uid() = user_id);
