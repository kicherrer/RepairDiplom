-- Создаем новую таблицу для жанров
CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    name_ru VARCHAR(255),
    name_en VARCHAR(255)
);

-- Создаем таблицу связей медиа и жанров
CREATE TABLE IF NOT EXISTS media_genres (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media_items(id),
    genre_id INTEGER REFERENCES genres(id)
);

-- Очищаем таблицу жанров
TRUNCATE TABLE genres RESTART IDENTITY CASCADE;

-- Добавляем жанры
INSERT INTO genres (name, name_ru, name_en) VALUES
('Action', 'Боевик', 'Action'),
('Adventure', 'Приключения', 'Adventure'),
('Comedy', 'Комедия', 'Comedy'),
('Crime', 'Криминал', 'Crime'),
('Drama', 'Драма', 'Drama'),
('Fantasy', 'Фэнтези', 'Fantasy'),
('Historical', 'Исторический', 'Historical'),
('Horror', 'Ужасы', 'Horror'),
('Mystery', 'Детектив', 'Mystery'),
('Romance', 'Мелодрама', 'Romance'),
('Science Fiction', 'Научная фантастика', 'Science Fiction'),
('Thriller', 'Триллер', 'Thriller'),
('Western', 'Вестерн', 'Western'),
('Animation', 'Мультфильм', 'Animation'),
('Documentary', 'Документальный', 'Documentary');
