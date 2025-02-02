class Api {
    static BASE_URL = '../api/api.php';

    static async request(action, data = {}) {
        try {
            const formData = new FormData();
            formData.append('action', action);

            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error(`API Error (${action}):`, error);
            return { status: 'error', message: 'Ошибка сети' };
        }
    }

    static async register(email, password) {
        return await this.request('register', { email, password });
    }

    static async login(email, password) {
        const response = await this.request('login', { email, password });
        if (response.status === 'success') {
            localStorage.setItem('userRole', response.role);
        }
        return response;
    }

    static async getProgress(courseId) {
        return await this.request('get_progress', { course_id: courseId });
    }

    static async logout() {
        localStorage.removeItem('userRole');
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

    static isAdmin() {
        return localStorage.getItem('userRole') === 'admin';
    }

    static async getGrades() {
        return this.request('get_grades');
    }

    static async setGrade(userId, lessonId, grade) {
        const response = await this.request('set_grade', {
            user_id: userId,
            lesson_id: lessonId,
            grade: grade
        });

        if (response.status === 'success') {
            // Обновляем все списки оценок
            await Promise.all([
                this.updateGradesTable(),
                loadGrades(),
                loadAverageGrades(),
                loadGroupAverageGrades()
            ]);
        }

        return response;
    }

    static async updateGradesTable() {
        const gradesResponse = await this.request('get_grades');
        if (gradesResponse.status === 'success') {
            const gradesTable = document.getElementById('gradesTable');
            if (gradesTable) {
                gradesTable.innerHTML = gradesResponse.grades.map(grade => `
                    <tr>
                        <td>${grade.user_email}</td>
                        <td>${grade.course_title}</td>
                        <td>${grade.lesson_title}</td>
                        <td>
                            <input type="number" 
                                   class="form-control grade-input" 
                                   value="${grade.grade}" 
                                   min="0" 
                                   max="5" 
                                   step="0.1"
                                   data-user-id="${grade.user_id}"
                                   data-lesson-id="${grade.lesson_id}"
                                   onchange="updateGrade(this)">
                        </td>
                        <td>${new Date(grade.created_at).toLocaleString()}</td>
                    </tr>
                `).join('');
            }
        }
    }

    static async getGroups() {
        return this.request('get_groups');
    }

    static async createGroup(name, userIds) {
        return this.request('create_group', {
            name,
            user_ids: JSON.stringify(userIds)
        });
    }

    static async getUnreadMessagesCount() {
        return this.request('get_unread_messages_count');
    }

    static async markMessagesAsRead() {
        return this.request('mark_messages_as_read');
    }
} 