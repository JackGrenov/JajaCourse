<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Функция для безопасной обработки входных данных
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Маршрутизация запросов
$action = isset($_POST['action']) ? $_POST['action'] : '';

switch($action) {
    case 'register':
        register($pdo);
        break;
    case 'login':
        login($pdo);
        break;
    case 'get_progress':
        getProgress($pdo);
        break;
    case 'get_courses':
        getCourses($pdo);
        break;
    case 'check_auth':
        checkAuth();
        break;
    case 'logout':
        logout();
        break;
    case 'check_admin':
        checkAdmin();
        break;
    case 'get_all_courses':
        getAllCourses($pdo);
        break;
    case 'get_users':
        getUsers($pdo);
        break;
    case 'add_course':
        addCourse($pdo);
        break;
    case 'update_course':
        updateCourse($pdo);
        break;
    case 'delete_course':
        deleteCourse($pdo);
        break;
    case 'toggle_user_role':
        toggleUserRole($pdo);
        break;
    case 'delete_user':
        deleteUser($pdo);
        break;
    case 'get_course':
        getCourse($pdo);
        break;
    case 'get_course_details':
        getCourseDetails($pdo);
        break;
    case 'toggle_lesson':
        toggleLesson($pdo);
        break;
    case 'send_message':
        sendMessage($pdo);
        break;
    case 'get_messages':
        getMessages($pdo);
        break;
    case 'add_lesson':
        addLesson($pdo);
        break;
    case 'update_lesson':
        updateLesson($pdo);
        break;
    case 'delete_lesson':
        deleteLesson($pdo);
        break;
    case 'get_lesson':
        getLesson($pdo);
        break;
    case 'get_lesson_materials':
        getLessonMaterials($pdo);
        break;
    case 'add_material':
        addMaterial($pdo);
        break;
    case 'update_material':
        updateMaterial($pdo);
        break;
    case 'delete_material':
        deleteMaterial($pdo);
        break;
    case 'get_material':
        getMaterial($pdo);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Неизвестное действие']);
}

// Функция регистрации
function register($pdo) {
    $email = sanitize($_POST['email']);
    $password = $_POST['password'];
    
    // Проверяем существование пользователя
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email уже зарегистрирован']);
        return;
    }
    
    // Хэшируем пароль
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Добавляем пользователя
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    
    try {
        $stmt->execute([$email, $hashedPassword]);
        echo json_encode(['status' => 'success', 'message' => 'Регистрация успешна']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка регистрации']);
    }
}

// Функция авторизации
function login($pdo) {
    global $pdo;
    $email = sanitize($_POST['email']);
    $password = $_POST['password'];
    
    $stmt = $pdo->prepare("SELECT id, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        echo json_encode([
            'status' => 'success', 
            'message' => 'Авторизация успешна',
            'role' => $user['role']
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Неверный email или пароль']);
    }
}

function getProgress($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $courseId = sanitize($_POST['course_id']);
    $userId = $_SESSION['user_id'];

    $stmt = $pdo->prepare("
        SELECT progress 
        FROM user_progress 
        WHERE user_id = ? AND course_id = ?
    ");
    $stmt->execute([$userId, $courseId]);
    $progress = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'progress' => $progress ? $progress['progress'] : 0
    ]);
}

function getCourses($pdo) {
    $stmt = $pdo->query("SELECT id, title, description FROM courses");
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (isset($_SESSION['user_id'])) {
        foreach ($courses as &$course) {
            // Получаем общее количество уроков
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM lessons WHERE course_id = ?");
            $stmt->execute([$course['id']]);
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Получаем количество завершенных уроков
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as completed 
                FROM user_lessons 
                WHERE user_id = ? AND course_id = ? AND completed = 1
            ");
            $stmt->execute([$_SESSION['user_id'], $course['id']]);
            $completed = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];

            // Вычисляем процент
            $course['progress'] = $total > 0 ? round(($completed / $total) * 100) : 0;
        }
    } else {
        foreach ($courses as &$course) {
            $course['progress'] = 0;
        }
    }

    echo json_encode(['status' => 'success', 'courses' => $courses]);
}

function checkAuth() {
    global $pdo;
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Не авторизован'
        ]);
        return;
    }

    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'user_id' => $_SESSION['user_id'],
        'role' => $user['role']
    ]);
}

function logout() {
    session_start();
    session_destroy();
    echo json_encode(['status' => 'success', 'message' => 'Выход выполнен успешно']);
}

function checkAdmin() {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }
    
    global $pdo;
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && $user['role'] === 'admin') {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Нет прав доступа']);
    }
}

function getAllCourses($pdo) {
    $stmt = $pdo->query("SELECT * FROM courses ORDER BY id DESC");
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'courses' => $courses]);
}

function getUsers($pdo) {
    $stmt = $pdo->query("SELECT id, email, role FROM users ORDER BY id DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'users' => $users]);
}

function addCourse($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }
    
    $title = sanitize($_POST['title']);
    $description = sanitize($_POST['description']);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description) VALUES (?, ?)");
        $stmt->execute([$title, $description]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при добавлении курса: ' . $e->getMessage()
        ]);
    }
}

function updateCourse($pdo) {
    $id = sanitize($_POST['id']);
    $title = sanitize($_POST['title']);
    $description = sanitize($_POST['description']);
    
    $stmt = $pdo->prepare("UPDATE courses SET title = ?, description = ? WHERE id = ?");
    try {
        $stmt->execute([$title, $description, $id]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при обновлении курса']);
    }
}

function deleteCourse($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Удаляем связанные записи из таблицы user_lessons
        $stmt = $pdo->prepare("DELETE FROM user_lessons WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем связанные записи из таблицы user_progress
        $stmt = $pdo->prepare("DELETE FROM user_progress WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем связанные записи из таблицы grades
        $stmt = $pdo->prepare("DELETE FROM grades WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем уроки курса
        $stmt = $pdo->prepare("DELETE FROM lessons WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем сам курс
        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при удалении курса']);
    }
}

function toggleUserRole($pdo) {
    $id = sanitize($_POST['id']);
    
    $stmt = $pdo->prepare("UPDATE users SET role = CASE WHEN role = 'admin' THEN 'user' ELSE 'admin' END WHERE id = ?");
    try {
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при изменении роли']);
    }
}

function deleteUser($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Удаляем сообщения чата
        $stmt = $pdo->prepare("DELETE FROM chat_messages WHERE user_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем прогресс пользователя
        $stmt = $pdo->prepare("DELETE FROM user_progress WHERE user_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем оценки пользователя
        $stmt = $pdo->prepare("DELETE FROM grades WHERE user_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем информацию о пройденных уроках
        $stmt = $pdo->prepare("DELETE FROM user_lessons WHERE user_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем самого пользователя
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        $pdo->rollBack();
        echo json_encode([
            'status' => 'error', 
            'message' => 'Ошибка при удалении пользователя: ' . $e->getMessage()
        ]);
    }
}

// Добавим функцию для получения информации о курсе
function getCourse($pdo) {
    $id = sanitize($_POST['id']);
    
    $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
    $stmt->execute([$id]);
    $course = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($course) {
        echo json_encode(['status' => 'success', 'course' => $course]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Курс не найден']);
    }
}

function getCourseDetails($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        // Получаем информацию о курсе
        $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        $course = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$course) {
            echo json_encode(['status' => 'error', 'message' => 'Курс не найден']);
            return;
        }
        
        // Получаем уроки курса и их статус для текущего пользователя
        $stmt = $pdo->prepare("
            SELECT l.*, 
            COALESCE(ul.completed, 0) as completed
            FROM lessons l
            LEFT JOIN user_lessons ul ON l.id = ul.lesson_id 
                AND ul.user_id = ? AND ul.course_id = ?
            WHERE l.course_id = ?
            ORDER BY l.order_num ASC
        ");
        $stmt->execute([$_SESSION['user_id'], $id, $id]);
        $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'course' => $course,
            'lessons' => $lessons
        ]);
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при получении данных курса: ' . $e->getMessage()
        ]);
    }
}

function toggleLesson($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }
    
    $courseId = sanitize($_POST['course_id']);
    $lessonId = sanitize($_POST['lesson_id']);
    $completed = filter_var($_POST['completed'], FILTER_VALIDATE_BOOLEAN);
    
    try {
        if ($completed) {
            $stmt = $pdo->prepare("
                INSERT INTO user_lessons (user_id, course_id, lesson_id, completed)
                VALUES (?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE completed = 1
            ");
        } else {
            $stmt = $pdo->prepare("
                DELETE FROM user_lessons 
                WHERE user_id = ? AND course_id = ? AND lesson_id = ?
            ");
        }
        
        $stmt->execute([$_SESSION['user_id'], $courseId, $lessonId]);
        
        // Обновляем общий прогресс курса
        updateCourseProgress($pdo, $_SESSION['user_id'], $courseId);
        
        echo json_encode([
            'status' => 'success',
            'completed' => $completed
        ]);
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Ошибка при обновлении прогресса: ' . $e->getMessage()
        ]);
    }
}

function updateCourseProgress($pdo, $userId, $courseId) {
    // Получаем общее количество уроков в курсе
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM lessons WHERE course_id = ?");
    $stmt->execute([$courseId]);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Получаем количество завершенных уроков
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as completed 
        FROM user_lessons 
        WHERE user_id = ? AND course_id = ? AND completed = 1
    ");
    $stmt->execute([$userId, $courseId]);
    $completed = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];
    
    // Вычисляем процент прогресса
    $progress = $total > 0 ? round(($completed / $total) * 100) : 0;
    
    // Обновляем прогресс в таблице user_progress
    $stmt = $pdo->prepare("
        INSERT INTO user_progress (user_id, course_id, progress)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE progress = ?
    ");
    $stmt->execute([$userId, $courseId, $progress, $progress]);
}

function getMessages($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $lastId = isset($_POST['last_id']) ? (int)$_POST['last_id'] : 0;
    $userId = $_SESSION['user_id'];
    
    // Проверяем роль пользователя
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    try {
        if ($user['role'] === 'admin') {
            // Для админа показываем переписку с конкретным студентом
            $studentId = isset($_POST['student_id']) ? (int)$_POST['student_id'] : 0;
            if (!$studentId) {
                echo json_encode(['status' => 'error', 'message' => 'Не выбран студент']);
                return;
            }
            
            $stmt = $pdo->prepare("
                SELECT m.*, u.email as username, m.ot
                FROM chat_messages m 
                JOIN users u ON m.user_id = u.id
                WHERE m.user_id = ?
                ORDER BY m.created_at ASC
                LIMIT 50
            ");
            $stmt->execute([$studentId]);
        } else {
            // Для студента показываем его переписку
            $stmt = $pdo->prepare("
                SELECT m.*, u.email as username, m.ot
                FROM chat_messages m 
                JOIN users u ON m.user_id = u.id
                WHERE m.user_id = ?
                ORDER BY m.created_at ASC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
        }
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => 'success',
            'messages' => $messages
        ]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении сообщений']);
    }
}

function sendMessage($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $message = sanitize($_POST['message']);
    $userId = $_SESSION['user_id'];
    
    // Проверяем роль пользователя
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    try {
        if ($user['role'] === 'admin') {
            // Админ отправляет сообщение студенту
            $studentId = isset($_POST['student_id']) ? (int)$_POST['student_id'] : 0;
            if (!$studentId) {
                echo json_encode(['status' => 'error', 'message' => 'Не выбран студент']);
                return;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO chat_messages (user_id, message, ot) 
                VALUES (?, ?, 'admin')
            ");
            $stmt->execute([$studentId, $message]);
        } else {
            // Студент отправляет сообщение
            $stmt = $pdo->prepare("
                INSERT INTO chat_messages (user_id, message, ot) 
                VALUES (?, ?, 'user')
            ");
            $stmt->execute([$userId, $message]);
        }
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при отправке сообщения']);
    }
}

function addLesson($pdo) {
    $courseId = sanitize($_POST['course_id']);
    $title = sanitize($_POST['title']);
    $content = sanitize($_POST['content']);
    $orderNum = (int)$_POST['order_num'];
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO lessons (course_id, title, content, order_num) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$courseId, $title, $content, $orderNum]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при добавлении урока']);
    }
}

function updateLesson($pdo) {
    $id = sanitize($_POST['id']);
    $title = sanitize($_POST['title']);
    $content = sanitize($_POST['content']);
    $orderNum = (int)$_POST['order_num'];
    
    try {
        $stmt = $pdo->prepare("
            UPDATE lessons 
            SET title = ?, content = ?, order_num = ?
            WHERE id = ?
        ");
        $stmt->execute([$title, $content, $orderNum, $id]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при обновлении урока']);
    }
}

function deleteLesson($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $pdo->beginTransaction();
        
        // Удаляем записи о выполнении урока
        $stmt = $pdo->prepare("DELETE FROM user_lessons WHERE lesson_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем сам урок
        $stmt = $pdo->prepare("DELETE FROM lessons WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при удалении урока']);
    }
}

function getLesson($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $stmt = $pdo->prepare("
            SELECT l.*, 
            COALESCE(ul.completed, 0) as completed
            FROM lessons l
            LEFT JOIN user_lessons ul ON l.id = ul.lesson_id 
                AND ul.user_id = ? 
            WHERE l.id = ?
        ");
        $stmt->execute([$_SESSION['user_id'], $id]);
        $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($lesson) {
            echo json_encode([
                'status' => 'success',
                'lesson' => $lesson
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Урок не найден'
            ]);
        }
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при получении урока: ' . $e->getMessage()
        ]);
    }
}

function getLessonMaterials($pdo) {
    $lessonId = sanitize($_POST['lesson_id']);
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM lesson_materials 
            WHERE lesson_id = ? 
            ORDER BY order_num ASC
        ");
        $stmt->execute([$lessonId]);
        $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'materials' => $materials
        ]);
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при получении материалов: ' . $e->getMessage()
        ]);
    }
}

function addMaterial($pdo) {
    error_log('=== Adding Material ===');
    error_log('POST data: ' . print_r($_POST, true));
    
    $lessonId = sanitize($_POST['lesson_id']);
    $title = sanitize($_POST['title']);
    $content = $_POST['content'];
    $type = sanitize($_POST['type']);
    $orderNum = (int)$_POST['order_num'];
    
    error_log("Processed data:");
    error_log("lesson_id: $lessonId");
    error_log("title: $title");
    error_log("content: $content");
    error_log("type: $type");
    error_log("order_num: $orderNum");
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO lesson_materials (lesson_id, title, content, type, order_num)
            VALUES (?, ?, ?, ?, ?)
        ");
        $result = $stmt->execute([$lessonId, $title, $content, $type, $orderNum]);
        error_log("Execute result: " . ($result ? 'true' : 'false'));
        
        if ($result) {
            echo json_encode(['status' => 'success']);
        } else {
            error_log("PDO Error Info: " . print_r($stmt->errorInfo(), true));
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to insert material'
            ]);
        }
    } catch(PDOException $e) {
        error_log("PDO Exception: " . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при добавлении материала: ' . $e->getMessage()
        ]);
    }
}

function updateMaterial($pdo) {
    $id = sanitize($_POST['id']);
    $title = sanitize($_POST['title']);
    $content = $_POST['content']; // Не используем sanitize для HTML-контента
    $type = sanitize($_POST['type']);
    $orderNum = (int)$_POST['order_num'];
    
    try {
        $stmt = $pdo->prepare("
            UPDATE lesson_materials 
            SET title = ?, content = ?, type = ?, order_num = ?
            WHERE id = ?
        ");
        $stmt->execute([$title, $content, $type, $orderNum, $id]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при обновлении материала'
        ]);
    }
}

function deleteMaterial($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $stmt = $pdo->prepare("DELETE FROM lesson_materials WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при удалении материала'
        ]);
    }
}

function getMaterial($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM lesson_materials WHERE id = ?");
        $stmt->execute([$id]);
        $material = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($material) {
            echo json_encode([
                'status' => 'success',
                'material' => $material
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Материал не найден'
            ]);
        }
    } catch(PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при получении материала'
        ]);
    }
}
?> 