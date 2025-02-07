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
    case 'get_user_profile':
        getUserProfile($pdo);
        break;
    case 'update_avatar':
        handleUpdateAvatar();
        break;
    case 'update_course_image':
        handleUpdateCourseImage();
        break;
    case 'update_password':
        updatePassword($pdo);
        break;
    case 'get_admins':
        getAdmins($pdo);
        break;
    case 'create_group':
        createGroup($pdo);
        break;
    case 'get_groups':
        getGroups($pdo);
        break;
    case 'delete_group':
        deleteGroup($pdo);
        break;
    case 'remove_user_from_group':
        removeUserFromGroup($pdo);
        break;
    case 'add_user_to_group':
        addUserToGroup($pdo);
        break;
    case 'update_group':
        updateGroup($pdo);
        break;
    case 'get_grades':
        getGrades($pdo);
        break;
    case 'set_grade':
        setGrade($pdo);
        break;
    case 'get_average_grades':
        getAverageGrades($pdo);
        break;
    case 'delete_grade':
        deleteGrade($pdo);
        break;
    case 'get_group_average_grades':
        getGroupAverageGrades($pdo);
        break;
    case 'get_user_grades':
        getUserGrades($pdo);
        break;
    case 'get_user_group':
        getUserGroup($pdo);
        break;
    case 'get_unread_messages_count':
        getUnreadMessagesCount($pdo);
        break;
    case 'mark_messages_as_read':
        markMessagesAsRead($pdo);
        break;
    case 'get_unread_messages_by_admin':
        getUnreadMessagesByAdmin($pdo);
        break;
    case 'update_full_name':
        updateFullName($pdo);
        break;
    case 'update_user_full_name':
        updateUserFullName($pdo);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Неизвестное действие']);
}

// Функция регистрации
function register($pdo) {
    try {
        // Проверяем наличие обязательных полей
        if (!isset($_POST['email']) || !isset($_POST['password'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Email и пароль обязательны для заполнения'
            ]);
            return;
        }

        $email = sanitize($_POST['email']);
        $password = $_POST['password'];
        $fullName = isset($_POST['full_name']) ? sanitize($_POST['full_name']) : null;

        // Валидация email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Некорректный формат email'
            ]);
            return;
        }

        // Проверяем длину пароля
        if (strlen($password) < 6) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Пароль должен содержать минимум 6 символов'
            ]);
            return;
        }
        
        // Проверяем существование пользователя
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Email уже зарегистрирован'
            ]);
            return;
        }
        
        // Хэшируем пароль
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Добавляем пользователя
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role, full_name) VALUES (?, ?, 'user', ?)");
        $stmt->execute([$email, $hashedPassword, $fullName]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Регистрация успешна'
        ]);

    } catch(PDOException $e) {
        // Логируем ошибку
        error_log("Registration error: " . $e->getMessage());
        
        // Возвращаем понятное пользователю сообщение об ошибке
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при регистрации. Пожалуйста, попробуйте позже.',
            'debug' => $e->getMessage() // Для отладки
        ]);
    }
}

// Функция авторизации
function login($pdo) {
    $email = sanitize($_POST['email']);
    $password = $_POST['password'];
    
    try {
        $stmt = $pdo->prepare("SELECT id, email, password, role FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            
            echo json_encode([
                'status' => 'success',
                'user_id' => $user['id'],
                'role' => $user['role']
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Неверный email или пароль']);
        }
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при входе в систему']);
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
    $stmt = $pdo->query("
        SELECT c.id, c.title, c.description, c.image,
               COALESCE(u.full_name, u.email) as created_by_name,
               u.id as created_by_id
        FROM courses c
        LEFT JOIN users u ON c.created_by = u.id
    ");
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
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'status' => 'success',
            'user_id' => $_SESSION['user_id'],
            'role' => $_SESSION['role']
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
    }
}

function logout() {
    session_unset();
    session_destroy();
    echo json_encode(['status' => 'success']);
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
    $stmt = $pdo->query("SELECT id, email, role, full_name FROM users ORDER BY id DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'users' => $users]);
}

function addCourse($pdo) {
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Нет прав доступа']);
        return;
    }

    if (!isset($_POST['title']) || !isset($_POST['description'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не все данные предоставлены']);
        return;
    }
    
    $title = sanitize($_POST['title']);
    $description = sanitize($_POST['description']);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description, created_by) VALUES (?, ?, ?)");
        if (!$stmt->execute([$title, $description, $_SESSION['user_id']])) {
            throw new Exception('Ошибка при выполнении запроса');
        }
        
        $courseId = $pdo->lastInsertId();
        
        echo json_encode([
            'status' => 'success',
            'course_id' => $courseId,
            'message' => 'Курс успешно добавлен'
        ]);
    } catch(Exception $e) {
        error_log('Error adding course: ' . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при добавлении курса'
        ]);
    }
}

function updateCourse($pdo) {
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Нет прав доступа']);
        return;
    }

    if (!isset($_POST['id']) || !isset($_POST['title']) || !isset($_POST['description'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не все данные предоставлены']);
        return;
    }

    $id = sanitize($_POST['id']);
    $title = sanitize($_POST['title']);
    $description = sanitize($_POST['description']);
    
    try {
        $stmt = $pdo->prepare("UPDATE courses SET title = ?, description = ? WHERE id = ?");
        if (!$stmt->execute([$title, $description, $id])) {
            throw new Exception('Ошибка при выполнении запроса');
        }
        echo json_encode([
            'status' => 'success',
            'message' => 'Курс успешно обновлен'
        ]);
    } catch(Exception $e) {
        error_log('Error updating course: ' . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка при обновлении курса: ' . $e->getMessage()
        ]);
    }
}

function deleteCourse($pdo) {
    $id = sanitize($_POST['id']);
    
    try {
        $pdo->beginTransaction();

        // Сначала удаляем материалы уроков
        $stmt = $pdo->prepare("
            DELETE lm FROM lesson_materials lm
            INNER JOIN lessons l ON lm.lesson_id = l.id
            WHERE l.course_id = ?
        ");
        $stmt->execute([$id]);
        
        // Удаляем оценки, связанные с уроками курса
        $stmt = $pdo->prepare("
            DELETE g FROM grades g
            INNER JOIN lessons l ON g.lesson_id = l.id
            WHERE l.course_id = ?
        ");
        $stmt->execute([$id]);
        
        // Удаляем записи о прохождении уроков
        $stmt = $pdo->prepare("DELETE FROM user_lessons WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем прогресс пользователей по курсу
        $stmt = $pdo->prepare("DELETE FROM user_progress WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Удаляем уроки курса
        $stmt = $pdo->prepare("DELETE FROM lessons WHERE course_id = ?");
        $stmt->execute([$id]);
        
        // Наконец, удаляем сам курс
        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        $pdo->rollBack();
        error_log('Error deleting course: ' . $e->getMessage());
        echo json_encode([
            'status' => 'error', 
            'message' => 'Ошибка при удалении курса: ' . $e->getMessage()
        ]);
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
    if (!isset($_POST['id'])) {
        echo json_encode(['status' => 'error', 'message' => 'ID курса не указан']);
        return;
    }
    
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

        // Получаем уроки курса
        $stmt = $pdo->prepare("SELECT * FROM lessons WHERE course_id = ? ORDER BY order_num ASC");
        $stmt->execute([$id]);
        $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Если пользователь не админ, получаем его среднюю оценку за курс
        $averageGrade = null;
        if (isset($_SESSION['user_id']) && isset($_SESSION['role']) && $_SESSION['role'] !== 'admin') {
            $stmt = $pdo->prepare("
                SELECT AVG(g.grade) as average_grade
                FROM grades g
                JOIN lessons l ON g.lesson_id = l.id
                WHERE l.course_id = ? AND g.user_id = ?
            ");
            $stmt->execute([$id, $_SESSION['user_id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $averageGrade = $result['average_grade'] ? number_format((float)$result['average_grade'], 1) : null;
        }
        
        echo json_encode([
            'status' => 'success',
            'course' => $course,
            'lessons' => $lessons,
            'average_grade' => $averageGrade
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

function sendMessage($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $message = sanitize($_POST['message']);
    $userId = $_SESSION['user_id'];
    $selectedAdminId = isset($_POST['admin_id']) ? (int)$_POST['admin_id'] : null;
    
    try {
        // Проверяем роль пользователя
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['role'] === 'admin') {
            // Админ отправляет сообщение студенту
            $studentId = isset($_POST['student_id']) ? (int)$_POST['student_id'] : 0;
            if (!$studentId) {
                echo json_encode(['status' => 'error', 'message' => 'Не выбран студент']);
                return;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO chat_messages (user_id, message, ot, selected_admin_id, is_read) 
                VALUES (?, ?, 'admin', ?, 0)
            ");
            $stmt->execute([$studentId, $message, $userId]);
        } else {
            // Студент отправляет сообщение
            if (!$selectedAdminId) {
                echo json_encode(['status' => 'error', 'message' => 'Выберите администратора']);
                return;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO chat_messages (user_id, message, ot, selected_admin_id, is_read) 
                VALUES (?, ?, 'user', ?, 0)
            ");
            $stmt->execute([$userId, $message, $selectedAdminId]);
        }
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        error_log('Send message error: ' . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при отправке сообщения']);
    }
}

function getMessages($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $userId = $_SESSION['user_id'];
    $selectedAdminId = isset($_POST['admin_id']) ? (int)$_POST['admin_id'] : null;
    
    try {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['role'] === 'admin') {
            // Для админа показываем только сообщения, где он выбран как получатель
            $studentId = isset($_POST['student_id']) ? (int)$_POST['student_id'] : 0;
            if (!$studentId) {
                echo json_encode(['status' => 'error', 'message' => 'Не выбран студент']);
                return;
            }
            
            $stmt = $pdo->prepare("
                SELECT m.*, u.email as username, m.ot,
                       a.email as admin_email
                FROM chat_messages m 
                JOIN users u ON m.user_id = u.id
                LEFT JOIN users a ON m.selected_admin_id = a.id
                WHERE m.user_id = ? 
                AND (
                    (m.selected_admin_id = ? AND m.ot = 'user') OR 
                    (m.selected_admin_id IS NOT NULL AND m.ot = 'admin' AND m.selected_admin_id = ?)
                )
                ORDER BY m.created_at ASC
            ");
            $stmt->execute([$studentId, $userId, $userId]);
        } else {
            // Для студента показываем его переписку с выбранным админом
            $stmt = $pdo->prepare("
                SELECT m.*, u.email as username, m.ot,
                       a.email as admin_email
                FROM chat_messages m 
                JOIN users u ON m.user_id = u.id
                LEFT JOIN users a ON m.selected_admin_id = a.id
                WHERE m.user_id = ? 
                AND (
                    (m.selected_admin_id = ? AND m.ot = 'user') OR
                    (m.selected_admin_id = ? AND m.ot = 'admin')
                )
                ORDER BY m.created_at ASC
            ");
            $stmt->execute([$userId, $selectedAdminId, $selectedAdminId]);
        }
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => 'success',
            'messages' => $messages
        ]);
    } catch(PDOException $e) {
        error_log('Get messages error: ' . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении сообщений']);
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

function getUserProfile($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT email, avatar, role, full_name FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode([
                'status' => 'success',
                'email' => $user['email'],
                'avatar' => $user['avatar'],
                'role' => $user['role'],
                'full_name' => $user['full_name']
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Пользователь не найден']);
        }
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении профиля']);
    }
}

function handleUpdateAvatar() {
    checkAdmin();
    
    if (!isset($_FILES['avatar'])) {
        echo json_encode(['status' => 'error', 'message' => 'Файл не найден в запросе']);
        return;
    }

    $file = $_FILES['avatar'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessage = 'Ошибка загрузки файла: ';
        switch ($file['error']) {
            case UPLOAD_ERR_INI_SIZE:
                $errorMessage .= 'Превышен размер файла (php.ini)';
                break;
            case UPLOAD_ERR_FORM_SIZE:
                $errorMessage .= 'Превышен размер файла (HTML форма)';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMessage .= 'Файл загружен частично';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMessage .= 'Файл не был загружен';
                break;
            default:
                $errorMessage .= 'Код ошибки: ' . $file['error'];
        }
        echo json_encode(['status' => 'error', 'message' => $errorMessage]);
        return;
    }

    try {
        $fileName = uniqid() . '_' . basename($file['name']);
        $uploadDir = '../uploads/avatars/';
        $uploadPath = $uploadDir . $fileName;

        // Проверяем и создаем директорию
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                throw new Exception('Не удалось создать директорию для загрузки');
            }
        }

        // Проверяем права доступа
        if (!is_writable($uploadDir)) {
            throw new Exception('Нет прав на запись в директорию загрузки');
        }

        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            $avatarUrl = 'uploads/avatars/' . $fileName;
            global $db;
            $stmt = $db->prepare("UPDATE users SET avatar = ? WHERE id = ?");
            $stmt->execute([$avatarUrl, $_SESSION['user_id']]);

            echo json_encode([
                'status' => 'success',
                'avatar_url' => $avatarUrl
            ]);
        } else {
            throw new Exception('Не удалось переместить загруженный файл');
        }
    } catch(Exception $e) {
        error_log('Avatar upload error: ' . $e->getMessage());
        echo json_encode([
            'status' => 'error', 
            'message' => 'Ошибка при сохранении файла: ' . $e->getMessage()
        ]);
    }
}

function handleUpdateCourseImage() {
    checkAdmin();
    
    if (!isset($_FILES['image']) || !isset($_POST['course_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не все данные предоставлены']);
        return;
    }

    $courseId = (int)$_POST['course_id'];
    $file = $_FILES['image'];

    // Проверяем тип файла
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(['status' => 'error', 'message' => 'Неподдерживаемый тип файла']);
        return;
    }

    // Проверяем размер файла (максимум 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'Файл слишком большой']);
        return;
    }

    // Создаем директорию, если она не существует
    $uploadDir = '../uploads/courses/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Генерируем уникальное имя файла
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $targetPath = $uploadDir . $filename;
    $relativePath = 'uploads/courses/' . $filename;

    // Удаляем старое изображение
    global $pdo;
    $stmt = $pdo->prepare("SELECT image FROM courses WHERE id = ?");
    $stmt->execute([$courseId]);
    $oldImage = $stmt->fetchColumn();
    
    if ($oldImage && file_exists('../' . $oldImage)) {
        unlink('../' . $oldImage);
    }

    // Загружаем новое изображение
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Обновляем путь к изображению в базе данных
        $stmt = $pdo->prepare("UPDATE courses SET image = ? WHERE id = ?");
        $stmt->execute([$relativePath, $courseId]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Изображение успешно загружено',
            'image_url' => $relativePath
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при загрузке файла']);
    }
}

function updatePassword($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $currentPassword = $_POST['current_password'];
    $newPassword = $_POST['new_password'];

    try {
        // Проверяем текущий пароль
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!password_verify($currentPassword, $user['password'])) {
            echo json_encode(['status' => 'error', 'message' => 'Неверный текущий пароль']);
            return;
        }

        // Обновляем пароль
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $_SESSION['user_id']]);

        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка базы данных']);
    }
}

// Добавим новую функцию для получения непрочитанных сообщений по админам
function getUnreadMessagesByAdmin($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT selected_admin_id, COUNT(*) as unread_count 
            FROM chat_messages 
            WHERE user_id = ? 
            AND is_read = 0 
            AND ot = 'admin'
            GROUP BY selected_admin_id
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $unreadByAdmin = [];
        foreach ($result as $row) {
            $unreadByAdmin[$row['selected_admin_id']] = (int)$row['unread_count'];
        }

        return $unreadByAdmin;
    } catch(PDOException $e) {
        return [];
    }
}

// Обновим функцию getAdmins
function getAdmins($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT id, email, full_name FROM users WHERE role = 'admin'");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Получаем непрочитанные сообщения для каждого админа
        $unreadMessages = getUnreadMessagesByAdmin($pdo);
        
        // Добавляем количество непрочитанных сообщений к каждому админу
        foreach ($admins as &$admin) {
            $admin['unread_count'] = isset($unreadMessages[$admin['id']]) ? $unreadMessages[$admin['id']] : 0;
        }
        
        echo json_encode([
            'status' => 'success',
            'admins' => $admins
        ]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении списка администраторов']);
    }
}

// Функция создания группы
function createGroup($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $name = sanitize($_POST['name']);
    $userIds = isset($_POST['user_ids']) ? json_decode($_POST['user_ids']) : [];

    try {
        $pdo->beginTransaction();

        // Создаем группу
        $stmt = $pdo->prepare("INSERT INTO groups (name) VALUES (?)");
        $stmt->execute([$name]);
        $groupId = $pdo->lastInsertId();

        // Добавляем пользователей в группу
        if (!empty($userIds)) {
            $stmt = $pdo->prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)");
            foreach ($userIds as $userId) {
                $stmt->execute([$userId, $groupId]);
            }
        }

        $pdo->commit();
        echo json_encode(['status' => 'success', 'group_id' => $groupId]);
    } catch(PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при создании группы']);
    }
}

// Функция получения групп
function getGroups($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    try {
        // Получаем все группы с количеством пользователей
        $stmt = $pdo->prepare("
            SELECT g.*, COUNT(ug.user_id) as users_count
            FROM groups g
            LEFT JOIN user_groups ug ON g.id = ug.group_id
            GROUP BY g.id
        ");
        $stmt->execute();
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Получаем пользователей для каждой группы
        foreach ($groups as &$group) {
            $stmt = $pdo->prepare("
                SELECT u.id, u.email
                FROM users u
                JOIN user_groups ug ON u.id = ug.user_id
                WHERE ug.group_id = ?
            ");
            $stmt->execute([$group['id']]);
            $group['users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(['status' => 'success', 'groups' => $groups]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении групп']);
    }
}

// Функция удаления группы
function deleteGroup($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $groupId = (int)$_POST['group_id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM groups WHERE id = ?");
        $stmt->execute([$groupId]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при удалении группы']);
    }
}

// Вспомогательная функция проверки админа
function isAdmin() {
    $isAdmin = isset($_SESSION['user_id']) && isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
    if (!$isAdmin) {
        error_log('Admin check failed: ' . 
            'user_id=' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'not set') . 
            ', role=' . (isset($_SESSION['role']) ? $_SESSION['role'] : 'not set')
        );
    }
    return $isAdmin;
}

function removeUserFromGroup($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $userId = (int)$_POST['user_id'];
    $groupId = (int)$_POST['group_id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM user_groups WHERE user_id = ? AND group_id = ?");
        $stmt->execute([$userId, $groupId]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при удалении пользователя из группы']);
    }
}

function addUserToGroup($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $userId = (int)$_POST['user_id'];
    $groupId = (int)$_POST['group_id'];

    try {
        // Проверяем, не состоит ли пользователь уже в группе
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_groups WHERE user_id = ? AND group_id = ?");
        $stmt->execute([$userId, $groupId]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Пользователь уже в группе']);
            return;
        }

        // Добавляем пользователя в группу
        $stmt = $pdo->prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)");
        $stmt->execute([$userId, $groupId]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при добавлении пользователя в группу']);
    }
}

// Добавим функцию обновления группы
function updateGroup($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $groupId = (int)$_POST['id'];
    $name = sanitize($_POST['name']);
    $userIds = json_decode($_POST['user_ids']);

    try {
        $pdo->beginTransaction();

        // Обновляем название группы
        $stmt = $pdo->prepare("UPDATE groups SET name = ? WHERE id = ?");
        $stmt->execute([$name, $groupId]);

        // Удаляем всех пользователей из группы
        $stmt = $pdo->prepare("DELETE FROM user_groups WHERE group_id = ?");
        $stmt->execute([$groupId]);

        // Добавляем выбранных пользователей
        if (!empty($userIds)) {
            $stmt = $pdo->prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)");
            foreach ($userIds as $userId) {
                $stmt->execute([$userId, $groupId]);
            }
        }

        $pdo->commit();
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при обновлении группы']);
    }
}

function getGrades($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT 
                g.user_id,
                g.lesson_id,
                g.grade,
                g.created_at,
                u.email as user_email,
                l.title as lesson_title,
                c.title as course_title
            FROM grades g
            JOIN users u ON g.user_id = u.id
            JOIN lessons l ON g.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            ORDER BY g.created_at DESC
        ");
        $stmt->execute();
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'grades' => $grades
        ]);
    } catch(PDOException $e) {
        error_log("Error getting grades: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении оценок']);
    }
}

function setGrade($pdo) {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Нет доступа']);
        return;
    }

    try {
        // Получаем и валидируем данные
        $userId = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        $lessonId = isset($_POST['lesson_id']) ? (int)$_POST['lesson_id'] : 0;
        $grade = isset($_POST['grade']) ? (float)$_POST['grade'] : 0;

        // Добавляем отладочную информацию
        error_log("Setting grade - User ID: $userId, Lesson ID: $lessonId, Grade: $grade");

        // Проверяем корректность данных
        if (!$userId || !$lessonId || $grade < 0 || $grade > 5) {
            error_log("Invalid data - User ID: $userId, Lesson ID: $lessonId, Grade: $grade");
            echo json_encode(['status' => 'error', 'message' => 'Некорректные данные']);
            return;
        }

        // Проверяем существование пользователя
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            error_log("User not found - ID: $userId");
            echo json_encode(['status' => 'error', 'message' => 'Пользователь не найден']);
            return;
        }

        // Проверяем существование урока
        $stmt = $pdo->prepare("SELECT id FROM lessons WHERE id = ?");
        $stmt->execute([$lessonId]);
        if (!$stmt->fetch()) {
            error_log("Lesson not found - ID: $lessonId");
            echo json_encode(['status' => 'error', 'message' => 'Урок не найден']);
            return;
        }

        // Начинаем транзакцию
        $pdo->beginTransaction();

        try {
            // Проверяем существующую оценку
            $stmt = $pdo->prepare("
                SELECT id 
                FROM grades 
                WHERE user_id = ? AND lesson_id = ?
            ");
            $stmt->execute([$userId, $lessonId]);
            $existingGrade = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingGrade) {
                // Обновляем существующую оценку
                $stmt = $pdo->prepare("
                    UPDATE grades 
                    SET grade = ?, 
                        updated_at = CURRENT_TIMESTAMP,
                        created_by = ?
                    WHERE user_id = ? AND lesson_id = ?
                ");
                $stmt->execute([$grade, $_SESSION['user_id'], $userId, $lessonId]);
                error_log("Grade updated successfully");
            } else {
                // Добавляем новую оценку
                $stmt = $pdo->prepare("
                    INSERT INTO grades (user_id, lesson_id, grade, created_by) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$userId, $lessonId, $grade, $_SESSION['user_id']]);
                error_log("New grade added successfully");
            }

            // Фиксируем транзакцию
            $pdo->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Оценка сохранена',
                'grade' => $grade
            ]);
        } catch (PDOException $e) {
            // Откатываем транзакцию в случае ошибки
            $pdo->rollBack();
            error_log("Database error: " . $e->getMessage());
            throw $e;
        }
    } catch (PDOException $e) {
        error_log("Error in setGrade: " . $e->getMessage());
        echo json_encode([
            'status' => 'error', 
            'message' => 'Ошибка при сохранении оценки',
            'debug' => $e->getMessage() // Добавляем для отладки
        ]);
    }
}

function getAverageGrades($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    try {
        // Получаем общую среднюю оценку по всем урокам
        $stmt = $pdo->prepare("
            SELECT 
                u.id as user_id,
                u.email as user_email,
                AVG(g.grade) as average_grade,
                COUNT(g.id) as grades_count
            FROM users u
            LEFT JOIN grades g ON u.id = g.user_id
            WHERE u.role = 'user'
            GROUP BY u.id, u.email
        ");
        $stmt->execute();
        $overallAverages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Получаем средние оценки по курсам
        $stmt = $pdo->prepare("
            SELECT 
                u.id as user_id,
                u.email as user_email,
                c.id as course_id,
                c.title as course_title,
                AVG(g.grade) as course_average,
                COUNT(g.id) as course_grades_count
            FROM users u
            CROSS JOIN courses c
            LEFT JOIN lessons l ON l.course_id = c.id
            LEFT JOIN grades g ON g.lesson_id = l.id AND g.user_id = u.id
            WHERE u.role = 'user'
            GROUP BY u.id, u.email, c.id, c.title
            ORDER BY u.id, c.title
        ");
        $stmt->execute();
        $courseAverages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Форматируем данные
        $result = [];
        foreach ($overallAverages as $overall) {
            $result[$overall['user_id']] = [
                'user_email' => $overall['user_email'],
                'overall_average' => $overall['average_grade'] ? number_format((float)$overall['average_grade'], 1) : 'Нет оценок',
                'total_grades' => $overall['grades_count'],
                'courses' => []
            ];
        }

        foreach ($courseAverages as $course) {
            if (isset($result[$course['user_id']])) {
                $result[$course['user_id']]['courses'][] = [
                    'course_title' => $course['course_title'],
                    'average' => $course['course_average'] ? number_format((float)$course['course_average'], 1) : 'Нет оценок',
                    'grades_count' => $course['course_grades_count']
                ];
            }
        }

        echo json_encode([
            'status' => 'success', 
            'averages' => array_values($result)
        ]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении средних оценок']);
    }
}

function deleteGrade($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $userId = (int)$_POST['user_id'];
    $lessonId = (int)$_POST['lesson_id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM grades WHERE user_id = ? AND lesson_id = ?");
        $stmt->execute([$userId, $lessonId]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при удалении оценки']);
    }
}

function getGroupAverageGrades($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    try {
        // Сначала получаем количество студентов в каждой группе
        $stmt = $pdo->prepare("
            SELECT 
                g.id as group_id,
                g.name as group_name,
                COUNT(DISTINCT ug.user_id) as students_count
            FROM groups g
            LEFT JOIN user_groups ug ON g.id = ug.group_id
            GROUP BY g.id, g.name
        ");
        $stmt->execute();
        $groupsInfo = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Затем получаем оценки по курсам для каждой группы
        $stmt = $pdo->prepare("
            SELECT 
                g.id as group_id,
                g.name as group_name,
                c.id as course_id,
                c.title as course_title,
                AVG(gr.grade) as course_average,
                COUNT(gr.id) as grades_count
            FROM groups g
            LEFT JOIN user_groups ug ON g.id = ug.group_id
            CROSS JOIN courses c
            LEFT JOIN lessons l ON l.course_id = c.id
            LEFT JOIN grades gr ON gr.lesson_id = l.id AND gr.user_id = ug.user_id
            GROUP BY g.id, g.name, c.id, c.title
            ORDER BY g.name, c.title
        ");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Форматируем данные
        $groups = [];
        foreach ($groupsInfo as $groupInfo) {
            $groups[$groupInfo['group_id']] = [
                'group_name' => $groupInfo['group_name'],
                'students_count' => $groupInfo['students_count'],
                'courses' => []
            ];
        }

        foreach ($results as $row) {
            if (isset($groups[$row['group_id']])) {
                $groups[$row['group_id']]['courses'][] = [
                    'course_title' => $row['course_title'],
                    'average' => $row['course_average'] ? number_format((float)$row['course_average'], 1) : 'Нет оценок',
                    'grades_count' => $row['grades_count']
                ];
            }
        }

        echo json_encode([
            'status' => 'success',
            'groups' => array_values($groups)
        ]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении оценок групп']);
    }
}

function getUserGrades($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    try {
        // Получаем общую статистику
        $stmt = $pdo->prepare("
            SELECT 
                AVG(g.grade) as overall_average,
                COUNT(g.id) as total_grades
            FROM grades g
            WHERE g.user_id = ?
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $overall = $stmt->fetch(PDO::FETCH_ASSOC);

        // Получаем оценки по курсам
        $stmt = $pdo->prepare("
            SELECT 
                c.id as course_id,
                c.title as course_title,
                AVG(g.grade) as course_average,
                COUNT(g.id) as grades_count
            FROM courses c
            LEFT JOIN lessons l ON l.course_id = c.id
            LEFT JOIN grades g ON g.lesson_id = l.id AND g.user_id = ?
            GROUP BY c.id, c.title
            ORDER BY c.title
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $courseGrades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Получаем все оценки
        $stmt = $pdo->prepare("
            SELECT 
                c.title as course_title,
                l.title as lesson_title,
                g.grade,
                g.created_at
            FROM grades g
            JOIN lessons l ON g.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE g.user_id = ?
            ORDER BY g.created_at DESC
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $allGrades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'overall' => [
                'average' => $overall['overall_average'] ? number_format((float)$overall['overall_average'], 1) : 'Нет оценок',
                'total' => $overall['total_grades']
            ],
            'courses' => $courseGrades,
            'grades' => $allGrades
        ]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении оценок']);
    }
}

function getUserGroup($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT g.id, g.name, COUNT(ug2.user_id) as total_students
            FROM groups g
            JOIN user_groups ug ON g.id = ug.group_id
            LEFT JOIN user_groups ug2 ON g.id = ug2.group_id
            WHERE ug.user_id = ?
            GROUP BY g.id, g.name
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $group = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'group' => $group
        ]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении информации о группе']);
    }
}

function getUnreadMessagesCount($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin') {
            // Для админа считаем непрочитанные сообщения от каждого пользователя
            $stmt = $pdo->prepare("
                SELECT user_id, COUNT(*) as count 
                FROM chat_messages 
                WHERE selected_admin_id = ? 
                AND is_read = 0 
                AND ot = 'user'
                GROUP BY user_id
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $unreadByUser = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Считаем общее количество непрочитанных сообщений
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM chat_messages 
                WHERE selected_admin_id = ? 
                AND is_read = 0 
                AND ot = 'user'
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $totalUnread = $stmt->fetch(PDO::FETCH_ASSOC);

            // Формируем массив непрочитанных сообщений по пользователям
            $unreadCounts = [];
            foreach ($unreadByUser as $item) {
                $unreadCounts[$item['user_id']] = (int)$item['count'];
            }

            echo json_encode([
                'status' => 'success',
                'count' => (int)$totalUnread['count'],
                'unread_by_user' => $unreadCounts
            ]);
        } else {
            // Для обычного пользователя считаем непрочитанные сообщения от админов
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM chat_messages 
                WHERE user_id = ? 
                AND is_read = 0 
                AND ot = 'admin'
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'count' => (int)$result['count']
            ]);
        }
    } catch(PDOException $e) {
        error_log('Error getting unread messages: ' . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при получении сообщений']);
    }
}

function markMessagesAsRead($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin') {
            // Для админа отмечаем прочитанными сообщения только от конкретного пользователя
            $studentId = isset($_POST['student_id']) ? (int)$_POST['student_id'] : null;
            if ($studentId) {
                $stmt = $pdo->prepare("
                    UPDATE chat_messages 
                    SET is_read = 1 
                    WHERE selected_admin_id = ? 
                    AND user_id = ?
                    AND ot = 'user'
                ");
                $stmt->execute([$_SESSION['user_id'], $studentId]);
            }
        } else {
            // Для обычного пользователя отмечаем прочитанными сообщения от конкретного админа
            $adminId = isset($_POST['admin_id']) ? (int)$_POST['admin_id'] : null;
            if ($adminId) {
                $stmt = $pdo->prepare("
                    UPDATE chat_messages 
                    SET is_read = 1 
                    WHERE user_id = ? 
                    AND selected_admin_id = ?
                    AND ot = 'admin'
                ");
                $stmt->execute([$_SESSION['user_id'], $adminId]);
            }
        }

        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        error_log('Error marking messages as read: ' . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при обновлении сообщений']);
    }
}

function updateFullName($pdo) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Не авторизован']);
        return;
    }

    $fullName = sanitize($_POST['full_name']);
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET full_name = ? WHERE id = ?");
        $stmt->execute([$fullName, $_SESSION['user_id']]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при обновлении ФИО']);
    }
}

// Добавляем новую функцию для обновления ФИО пользователя админом
function updateUserFullName($pdo) {
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещен']);
        return;
    }

    $userId = (int)$_POST['user_id'];
    $fullName = sanitize($_POST['full_name']);
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET full_name = ? WHERE id = ?");
        $stmt->execute([$fullName, $userId]);
        echo json_encode(['status' => 'success']);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка при обновлении ФИО']);
    }
}
?> 