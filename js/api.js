class Api {
    static async request(action, data = {}) {
        try {
            let formData;
            
            // Проверяем, является ли data экземпляром FormData
            if (data instanceof FormData) {
                formData = data;
                formData.append('action', action);
            } else {
                formData = new FormData();
                formData.append('action', action);
                // Добавляем все переданные данные в FormData
                Object.keys(data).forEach(key => {
                    formData.append(key, data[key]);
                });
            }

            const response = await fetch('../api/api.php', {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { status: 'error', message: 'Ошибка сервера' };
        }
    }

    static async register(email, password) {
        return await this.request('register', { email, password });
    }

    static async login(email, password) {
        return await this.request('login', { email, password });
    }

    static async getProgress(courseId) {
        return await this.request('get_progress', { course_id: courseId });
    }

    static async logout() {
        return await this.request('logout');
    }

    static async checkAdmin() {
        return await this.request('check_admin');
    }

    static async getAllCourses() {
        return await this.request('get_all_courses');
    }

    static async getUsers() {
        return await this.request('get_users');
    }

    static async addCourse(data) {
        return await this.request('add_course', data);
    }

    static async updateCourse(data) {
        return await this.request('update_course', data);
    }

    static async deleteCourse(id) {
        return await this.request('delete_course', { id });
    }

    static async toggleUserRole(id) {
        return await this.request('toggle_user_role', { id });
    }

    static async deleteUser(id) {
        return await this.request('delete_user', { id });
    }

    static async getCourseDetails(id) {
        return await this.request('get_course_details', { id });
    }

    static async toggleLesson(courseId, lessonId, completed) {
        return await this.request('toggle_lesson', {
            course_id: courseId,
            lesson_id: lessonId,
            completed: completed
        });
    }

    static async sendMessage(message, studentId) {
        return await this.request('send_message', {
            message,
            student_id: studentId
        });
    }

    static async getMessages(lastId = 0, studentId) {
        return await this.request('get_messages', {
            last_id: lastId,
            student_id: studentId
        });
    }

    static async getLesson(id) {
        return await this.request('get_lesson', { id });
    }

    static async getLessonMaterials(lessonId) {
        console.log('Getting materials for lesson:', lessonId); // Отладочная информация
        return await this.request('get_lesson_materials', { lesson_id: lessonId });
    }

    static async addMaterial(data) {
        console.log('Adding material:', data); // Отладочная информация
        return await this.request('add_material', data);
    }

    static async updateMaterial(data) {
        console.log('Updating material:', data); // Отладочная информация
        return await this.request('update_material', data);
    }

    static async deleteMaterial(id) {
        return await this.request('delete_material', { id });
    }

    static async getUserProfile() {
        return await this.request('get_user_profile');
    }

    static async updateAvatar(formData) {
        return await this.request('update_avatar', formData);
    }

    static async updatePassword(data) {
        return await this.request('update_password', data);
    }
} 