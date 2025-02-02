<?php
class GradesModule {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getGrades($userId = null) {
        try {
            $sql = "SELECT g.*, u.email as user_email, l.title as lesson_title 
                    FROM grades g 
                    JOIN users u ON g.user_id = u.id 
                    JOIN lessons l ON g.lesson_id = l.id";
            $params = [];
            
            if ($userId) {
                $sql .= " WHERE g.user_id = ?";
                $params[] = $userId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return [
                'status' => 'success',
                'grades' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
        } catch(PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Ошибка при получении оценок'
            ];
        }
    }
} 