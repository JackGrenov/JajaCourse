CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(191) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar VARCHAR(255) DEFAULT NULL
);

CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_progress (
    user_id INT,
    course_id INT,
    progress INT DEFAULT 0,
    PRIMARY KEY (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    course_id INT,
    grade INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    order_num INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE user_lessons (
    user_id INT,
    course_id INT,
    lesson_id INT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS chat_messages;
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    admin_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE lesson_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('theory', 'practice') DEFAULT 'theory',
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Добавление тестовых пользователей
INSERT INTO users (email, password, role) VALUES
('admin@example.com', '$2y$10$somehashedpassword1', 'admin'),
('user1@example.com', '$2y$10$somehashedpassword2', 'user'),
('user2@example.com', '$2y$10$somehashedpassword3', 'user'),
('user3@example.com', '$2y$10$somehashedpassword4', 'user');

-- Добавление тестовых курсов
INSERT INTO courses (title, description) VALUES
('Введение в программирование', 'Базовый курс по основам программирования'),
('Web-разработка', 'Изучение HTML, CSS и JavaScript'),
('База данных SQL', 'Основы работы с реляционными базами данных'),
('Python для начинающих', 'Изучение основ Python программирования');

-- Добавление прогресса пользователей
INSERT INTO user_progress (user_id, course_id, progress) VALUES
(2, 1, 75),
(2, 2, 30),
(3, 1, 100),
(3, 3, 50),
(4, 2, 25),
(4, 4, 60);

-- Добавление оценок
INSERT INTO grades (user_id, course_id, grade, comment) VALUES
(2, 1, 85, 'Отличная работа!'),
(2, 2, 70, 'Нужно больше практики'),
(3, 1, 95, 'Превосходно'),
(3, 3, 75, 'Хороший результат'),
(4, 2, 65, 'Требуется улучшение'),
(4, 4, 80, 'Очень хорошо');

-- Добавление тестовых уроков для курса "Введение в программирование"
INSERT INTO lessons (course_id, title, content, order_num) VALUES
(1, 'Введение в программирование', 'Что такое программирование, базовые концепции и термины.', 1),
(1, 'Переменные и типы данных', 'Изучение различных типов данных и работа с переменными.', 2),
(1, 'Условные операторы', 'IF, ELSE, SWITCH и другие условные конструкции.', 3),
(1, 'Циклы', 'FOR, WHILE, DO-WHILE и их применение.', 4),
(1, 'Функции', 'Создание и использование функций, параметры и возвращаемые значения.', 5);

-- Добавление тестовых уроков для курса "Web-разработка"
INSERT INTO lessons (course_id, title, content, order_num) VALUES
(2, 'Основы HTML', 'Структура HTML документа, основные теги и атрибуты.', 1),
(2, 'CSS стили', 'Работа со стилями, селекторы, свойства CSS.', 2),
(2, 'JavaScript основы', 'Введение в JavaScript, синтаксис, основные конструкции.', 3),
(2, 'Работа с DOM', 'Манипуляция элементами страницы через JavaScript.', 4),
(2, 'Адаптивный дизайн', 'Создание адаптивных веб-страниц, медиа-запросы.', 5);

-- Добавление тестовых уроков для курса "База данных SQL"
INSERT INTO lessons (course_id, title, content, order_num) VALUES
(3, 'Введение в базы данных', 'Основные понятия баз данных, СУБД, типы баз данных.', 1),
(3, 'Основы SQL', 'SELECT, INSERT, UPDATE, DELETE запросы.', 2),
(3, 'Связи между таблицами', 'Первичные и внешние ключи, типы связей.', 3),
(3, 'Сложные запросы', 'JOIN, подзапросы, агрегатные функции.', 4),
(3, 'Оптимизация запросов', 'Индексы, планы выполнения, оптимизация производительности.', 5);

-- Добавление тестовых уроков для курса "Python для начинающих"
INSERT INTO lessons (course_id, title, content, order_num) VALUES
(4, 'Введение в Python', 'История Python, установка, первая программа.', 1),
(4, 'Основы синтаксиса', 'Переменные, операторы, базовые типы данных в Python.', 2),
(4, 'Структуры данных', 'Списки, кортежи, словари, множества.', 3),
(4, 'Функции в Python', 'Создание функций, аргументы, возвращаемые значения.', 4),
(4, 'Работа с файлами', 'Чтение и запись файлов, работа с текстом.', 5);

-- Добавим немного тестовых данных о прогрессе пользователей в уроках
INSERT INTO user_lessons (user_id, course_id, lesson_id, completed) VALUES
(2, 1, 1, 1),
(2, 1, 2, 1),
(2, 1, 3, 1),
(2, 1, 4, 0),
(2, 1, 5, 0),
(3, 1, 1, 1),
(3, 1, 2, 1),
(3, 1, 3, 1),
(3, 1, 4, 1),
(3, 1, 5, 1),
(4, 2, 6, 1),
(4, 2, 7, 0),
(4, 2, 8, 0),
(4, 2, 9, 0),
(4, 2, 10, 0);

-- Добавим тестовые материалы для уроков
INSERT INTO lesson_materials (lesson_id, title, content, type, order_num) VALUES
-- Материалы для первого урока "Введение в программирование"
(1, 'Основы программирования', 'Программирование - это процесс создания компьютерных программ.

Основные понятия:
1. Алгоритм - последовательность действий для решения задачи
2. Переменная - именованная область памяти для хранения данных
3. Функция - блок кода, который можно вызывать многократно

Пример простой программы на Python:', 'theory', 0);

-- Обновляем таблицу user_lessons
ALTER TABLE user_lessons
DROP FOREIGN KEY user_lessons_ibfk_1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Обновляем таблицу user_progress
ALTER TABLE user_progress
DROP FOREIGN KEY user_progress_ibfk_1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Обновляем таблицу grades
ALTER TABLE grades
DROP FOREIGN KEY grades_ibfk_1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Обновляем таблицу chat_messages для user_id
ALTER TABLE chat_messages
DROP FOREIGN KEY chat_messages_ibfk_1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Обновляем таблицу chat_messages для admin_id
ALTER TABLE chat_messages
DROP FOREIGN KEY chat_messages_ibfk_2,
ADD FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE; 