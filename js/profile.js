document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    setupAvatarUpload();
    setupPasswordChange();
});

async function loadUserProfile() {
    const response = await Api.request('get_user_profile');
    if (response.status === 'success') {
        document.getElementById('userEmail').textContent = response.email;
        if (response.avatar) {
            document.getElementById('avatarImage').src = '../' + response.avatar;
        }

        // Проверяем роль пользователя
        if (response.role === 'user') {
            document.getElementById('studentInfo').style.display = 'flex';
            await Promise.all([
                loadUserGrades(),
                loadUserGroup()
            ]);
        }
    } else {
        window.location.href = 'login.html';
    }
}

async function loadUserGrades() {
    const response = await Api.request('get_user_grades');
    if (response.status === 'success') {
        // Отображаем общую статистику
        document.getElementById('overallGrade').textContent = response.overall.average;
        document.getElementById('totalGrades').textContent = response.overall.total;

        // Отображаем оценки по курсам
        document.getElementById('courseGrades').innerHTML = response.courses.map(course => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <strong>${course.course_title}</strong>
                    <small class="text-muted">(${course.grades_count} оценок)</small>
                </div>
                <span class="badge ${getBadgeClass(course.course_average)}">
                    ${course.course_average ? parseFloat(course.course_average).toFixed(1) : 'Нет оценок'}
                </span>
            </div>
        `).join('');

        // Отображаем все оценки
        document.getElementById('gradesTable').innerHTML = response.grades.map(grade => `
            <tr>
                <td>${grade.course_title}</td>
                <td>${grade.lesson_title}</td>
                <td><span class="badge ${getBadgeClass(grade.grade)}">${parseFloat(grade.grade).toFixed(1)}</span></td>
                <td>${new Date(grade.created_at).toLocaleString()}</td>
            </tr>
        `).join('');
    }
}

async function loadUserGroup() {
    const response = await Api.request('get_user_group');
    if (response.status === 'success' && response.group) {
        document.getElementById('userGroupInfo').innerHTML = `
            <h6 class="card-title">${response.group.name}</h6>
            <p class="card-text">Всего студентов в группе: ${response.group.total_students}</p>
        `;
    } else {
        document.getElementById('userGroupInfo').innerHTML = `
            <p class="text-muted">Вы не состоите ни в одной группе</p>
        `;
    }
}

function getBadgeClass(grade) {
    if (!grade) return 'bg-secondary';
    grade = parseFloat(grade);
    if (grade >= 4.5) return 'bg-success';
    if (grade >= 3.5) return 'bg-primary';
    if (grade >= 2.5) return 'bg-warning';
    return 'bg-danger';
}

function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (не более 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл слишком большой. Максимальный размер 5MB');
                return;
            }

            try {
                // Создаем объект FormData
                const formData = new FormData();
                formData.append('action', 'update_avatar');
                formData.append('avatar', file);

                // Используем прямой fetch для загрузки файла
                const response = await fetch('../api/api.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.status === 'success') {
                    document.getElementById('avatarImage').src = '../' + result.avatar_url;
                } else {
                    console.error('Server response:', result);
                    alert('Ошибка при загрузке аватара: ' + result.message);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Ошибка при загрузке аватара');
            }
        }
    });
}

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Уменьшаем максимальный размер со 300 до 150
                const MAX_SIZE = 50;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Увеличиваем степень сжатия, уменьшая качество с 0.7 до 0.6
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', 0.6); // Уменьшаем качество для большего сжатия
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function setupPasswordChange() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        const response = await Api.request('update_password', {
            current_password: document.getElementById('currentPassword').value,
            new_password: newPassword
        });

        if (response.status === 'success') {
            alert('Пароль успешно изменен');
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
            changePasswordForm.reset();
        } else {
            alert(response.message || 'Ошибка при изменении пароля');
        }
    });
}

function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

async function logout() {
    const response = await Api.logout();
    if (response.status === 'success') {
        window.location.href = 'login.html';
    }
}

class ProfileManager {
    static async loadUserData() {
        try {
            const [profile, grades, group] = await Promise.all([
                Api.request('get_user_profile'),
                Api.request('get_user_grades'),
                Api.request('get_user_group')
            ]);

            if (!profile.status === 'success') {
                throw new Error(profile.message || 'Ошибка загрузки профиля');
            }

            this.updateUI(profile, grades, group);
        } catch (error) {
            this.handleError(error);
        }
    }

    static handleError(error) {
        console.error('Profile Error:', error);
        const errorMessage = error.message || 'Произошла ошибка';
        // Показываем пользователю красивое уведомление об ошибке
        this.showErrorNotification(errorMessage);
    }
} 