let courseModal;
let lessonsModal;
let currentStudentId = null;
let chatInterval;
let currentGroupId = null;
let unreadCheckInterval;

// Функция обновления счетчика непрочитанных сообщений
async function updateUnreadCount() {
    try {
        const response = await Api.request('get_unread_messages_count');
        if (response.status === 'success') {
            const badge = document.getElementById('chatsBadge');
            if (response.count > 0) {
                badge.textContent = response.count;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        }
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

// Функция для показа модального окна добавления курса
function showAddCourseModal() {
    // Очищаем форму
    document.getElementById('courseForm').reset();
    document.getElementById('courseId').value = '';
    document.getElementById('courseModalTitle').textContent = 'Добавить курс';

    // Создаем новый экземпляр модального окна
    const modal = new bootstrap.Modal(document.getElementById('courseModal'));
    modal.show();
}

// Делаем функцию доступной глобально
window.showAddCourseModal = showAddCourseModal;

async function loadData() {
    await loadUsers();
    await loadStudents();
    await loadCourses();
    await loadGroups();
}

async function loadCourses() {
    const response = await Api.getAllCourses();
    if (response.status === 'success') {
        renderCourses(response.courses);
    }
}

async function loadUsers() {
    const response = await Api.getUsers();
    if (response.status === 'success') {
        document.getElementById('usersList').innerHTML = response.users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn btn-sm btn-${user.role === 'admin' ? 'warning' : 'success'}"
                                    onclick="toggleUserRole(${user.id})">
                                ${user.role === 'admin' ? 'Сделать пользователем' : 'Сделать админом'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Удалить</button>
                        </td>
                    </tr>
                `).join('');
    }
}

async function loadStudents() {
    const response = await Api.getUsers();
    if (response.status === 'success') {
        const students = response.users.filter(user => user.role === 'user');
        document.getElementById('studentsList').innerHTML = students.map(student => `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
               onclick="selectStudent(${student.id}, '${student.email}')">
                ${student.email}
                <span class="badge bg-danger rounded-pill unread-badge" id="student-badge-${student.id}" style="display: none;">0</span>
            </a>
        `).join('');
        updateStudentsUnreadCount();
    }
}

// Добавляем функцию обновления счетчиков непрочитанных сообщений для студентов
async function updateStudentsUnreadCount() {
    try {
        const response = await Api.request('get_unread_messages_count');
        if (response.status === 'success' && response.unread_by_user) {
            Object.entries(response.unread_by_user).forEach(([userId, count]) => {
                const badge = document.getElementById(`student-badge-${userId}`);
                if (badge) {
                    if (count > 0) {
                        badge.textContent = count;
                        badge.style.display = '';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error updating students unread count:', error);
    }
}

function selectStudent(studentId, studentEmail) {
    currentStudentId = studentId;

    // Обновляем активный элемент в списке
    document.querySelectorAll('#studentsList .list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    document.getElementById('chatTitle').textContent = `Чат со студентом: ${studentEmail}`;
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('chatForm').style.display = 'flex';

    if (chatInterval) {
        clearInterval(chatInterval);
    }

    getMessages();
    chatInterval = setInterval(getMessages, 3000);

    // Отмечаем как прочитанные только сообщения от выбранного студента
    Api.request('mark_messages_as_read', { student_id: studentId }).then(() => {
        updateUnreadCount();
        // Скрываем бейдж у выбранного студента
        const badge = document.getElementById(`student-badge-${studentId}`);
        if (badge) {
            badge.style.display = 'none';
        }
    });
}

async function getMessages() {
    if (!currentStudentId) {
        console.log('Студент не выбран');
        return;
    }

    const response = await Api.getMessages(0, currentStudentId);
    if (response.status === 'success') {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = response.messages.map(msg => `
            <div class="message ${msg.ot === 'admin' ? 'message-admin' : 'message-user'}">
                <div class="message-header">
                    <strong>${msg.ot === 'admin' ? 'Преподаватель' : msg.username}</strong>
                    <small class="text-muted">${new Date(msg.created_at).toLocaleString()}</small>
                </div>
                <div class="message-text">${msg.message}</div>
            </div>
        `).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Отмечаем как прочитанные только сообщения от текущего студента
        await Api.request('mark_messages_as_read', { student_id: currentStudentId });
        await updateUnreadCount();
        await updateStudentsUnreadCount();
    }
}

// Обновляем обработчик переключения вкладок
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        // Очищаем интервал чата
        if (chatInterval) {
            clearInterval(chatInterval);
            chatInterval = null;
        }

        // Если переключились на вкладку чатов, обновляем счетчики
        if (e.target.getAttribute('href') === '#chats') {
            await updateUnreadCount();
            await updateStudentsUnreadCount();
        }
    });
});

// Добавим очистку интервала при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (chatInterval) {
        clearInterval(chatInterval);
    }
    if (unreadCheckInterval) {
        clearInterval(unreadCheckInterval);
    }
});

// Управление уроками
async function manageLessons(courseId) {
    await loadLessons(courseId);
    lessonsModal.show();
}

async function loadLessons(courseId) {
    const response = await Api.request('get_course_details', { id: courseId });
    if (response.status === 'success') {
        document.getElementById('lessonCourseId').value = courseId; // Сохраняем ID курса
        document.getElementById('lessonsList').innerHTML = response.lessons.map(lesson => `
                    <tr>
                        <td>${lesson.order_num}</td>
                        <td>${lesson.title}</td>
                        <td>${lesson.content}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editLesson(${lesson.id})">
                                Редактировать
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteLesson(${lesson.id})">
                                Удалить
                            </button>
                            <button class="btn btn-info btn-sm" onclick="toggleMaterials(${lesson.id})">
                                Материалы
                            </button>
                        </td>
                    </tr>
                    <tr id="materials-${lesson.id}" style="display: none;">
                        <td colspan="4">
                            <div class="materials-container p-3 bg-light">
                                <h6>Материалы урока</h6>
                                <div id="materialsList-${lesson.id}"></div>
                                <button class="btn btn-success btn-sm mt-2" onclick="showAddMaterialModal(${lesson.id})">
                                    Добавить материал
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
    }
}

async function toggleMaterials(lessonId) {
    const materialsRow = document.getElementById(`materials-${lessonId}`);
    if (materialsRow.style.display === 'none') {
        materialsRow.style.display = 'table-row';
        await loadMaterials(lessonId);
    } else {
        materialsRow.style.display = 'none';
    }
}

async function loadMaterials(lessonId) {
    try {
        console.log('Loading materials for lesson:', lessonId);
        const response = await Api.getLessonMaterials(lessonId);
        console.log('Response:', response);

        const materialsContainer = document.getElementById(`materialsList-${lessonId}`);
        if (!materialsContainer) {
            console.error('Container not found for lesson:', lessonId);
            return;
        }

        if (response.status === 'success') {
            materialsContainer.innerHTML = response.materials.map(material => `
                        <div class="card mb-2">
                            <div class="card-body">
                                <h6 class="card-title">${material.title}</h6>
                                <p class="card-text">${material.content.substring(0, 100)}...</p>
                                <div class="btn-group">
                                    <button class="btn btn-primary btn-sm" onclick="editMaterial(${material.id})">
                                        Редактировать
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteMaterial(${material.id})">
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
        } else {
            console.error('Error loading materials:', response.message);
            materialsContainer.innerHTML = '<div class="alert alert-danger">Ошибка загрузки материалов</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        materialsContainer.innerHTML = '<div class="alert alert-danger">Произошла ошибка при загрузке материалов</div>';
    }
}

function showAddLessonForm() {
    document.getElementById('lessonForm').classList.remove('d-none');
    document.getElementById('lessonId').value = '';
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonContent').value = '';
    document.getElementById('lessonOrder').value = '';
}

function hideLessonForm() {
    document.getElementById('lessonForm').classList.add('d-none');
}

document.getElementById('lessonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        course_id: document.getElementById('lessonCourseId').value,
        title: document.getElementById('lessonTitle').value,
        content: document.getElementById('lessonContent').value,
        order_num: document.getElementById('lessonOrder').value
    };

    const lessonId = document.getElementById('lessonId').value;
    const response = await Api.request(
        lessonId ? 'update_lesson' : 'add_lesson',
        lessonId ? { ...data, id: lessonId } : data
    );

    if (response.status === 'success') {
        hideLessonForm();
        manageLessons(data.course_id);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем права и загружаем данные только один раз при загрузке страницы
    checkAdminAuth().then(() => {
        // Загружаем начальные данные
        loadData();

        // Запускаем проверку непрочитанных сообщений каждые 3 секунды
        updateUnreadCount();
        updateStudentsUnreadCount();
        unreadCheckInterval = setInterval(async () => {
            await updateUnreadCount();
            await updateStudentsUnreadCount();
        }, 3000);
    });

    // Добавляем обработчики для очистки интервалов при закрытии страницы
    window.addEventListener('beforeunload', () => {
        if (chatInterval) {
            clearInterval(chatInterval);
        }
        if (unreadCheckInterval) {
            clearInterval(unreadCheckInterval);
        }
    });

    // Инициализируем модальные окна
    courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
    lessonsModal = new bootstrap.Modal(document.getElementById('lessonsModal'));

    // Добавляем обработчик формы добавления/редактирования курса
    document.getElementById('courseForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        // Отключаем кнопку отправки формы, чтобы избежать двойной отправки
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const spinner = submitButton.querySelector('.spinner-border');
        const btnText = submitButton.querySelector('.btn-text');
        spinner.classList.remove('d-none');
        btnText.textContent = 'Сохранение...';

        const courseId = document.getElementById('courseId').value;
        const title = document.getElementById('courseTitle').value;
        const description = document.getElementById('courseDescription').value;

        let response;
        try {
            if (courseId) {
                response = await Api.request('update_course', {
                    id: courseId,
                    title: title,
                    description: description
                });
            } else {
                response = await Api.request('add_course', {
                    title: title,
                    description: description
                });
            }

            if (response.status === 'success') {
                // Закрываем модальное окно
                const modal = bootstrap.Modal.getInstance(document.getElementById('courseModal'));
                modal.hide();

                // Очищаем форму
                document.getElementById('courseForm').reset();
                document.getElementById('courseId').value = '';

                // Обновляем список курсов
                await loadCourses();
            } else {
                alert('Ошибка: ' + response.message);
            }
        } catch (error) {
            alert('Произошла ошибка при сохранении курса');
        } finally {
            // Включаем кнопку обратно
            submitButton.disabled = false;
            spinner.classList.add('d-none');
            btnText.textContent = 'Сохранить';
        }
    });

    // Добавляем обработчики для очистки интервала чата при переключении вкладок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            // Очищаем интервал чата
            if (chatInterval) {
                clearInterval(chatInterval);
                chatInterval = null;
            }

            // Если переключились на вкладку групп, обновляем данные
            if (e.target.getAttribute('href') === '#groups') {
                await loadGroups();
            }
        });
    });

    // Добавляем обработчик формы создания/редактирования группы
    const groupForm = document.getElementById('groupForm');
    if (groupForm) {
        groupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const groupId = document.getElementById('groupId').value;
            const name = document.getElementById('groupName').value;
            const selectedUsers = Array.from(document.querySelectorAll('#userCheckboxes input:checked'))
                .map(checkbox => checkbox.value);

            try {
                const response = await Api.request(groupId ? 'update_group' : 'create_group', {
                    id: groupId,
                    name: name,
                    user_ids: JSON.stringify(selectedUsers)
                });

                if (response.status === 'success') {
                    // Закрываем модальное окно
                    const modalElement = document.getElementById('groupModal');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    }

                    // Очищаем форму
                    groupForm.reset();
                    document.getElementById('groupId').value = '';

                    // Обновляем список групп
                    await loadGroups();

                    // Показываем уведомление
                    showNotification('success', groupId ? 'Группа обновлена' : 'Группа создана');
                } else {
                    showNotification('error', 'Ошибка при ' + (groupId ? 'обновлении' : 'создании') + ' группы');
                }
            } catch (error) {
                console.error('Error saving group:', error);
                showNotification('error', 'Произошла ошибка при сохранении группы');
            }
        });
    }

    // Добавляем обработчик для вкладки журнала
    document.querySelector('a[href="#grades"]').addEventListener('click', () => {
        loadGradesData();
    });

    // Добавляем обработчик формы оценок
    document.getElementById('gradeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const grade = parseFloat(document.getElementById('gradeInput').value);
        if (grade < 0 || grade > 5) {
            alert('Оценка должна быть от 0 до 5');
            return;
        }

        const data = {
            user_id: document.getElementById('gradeStudentSelect').value,
            lesson_id: document.getElementById('gradeLessonSelect').value,
            grade: grade
        };

        const response = await Api.request('set_grade', data);
        if (response.status === 'success') {
            await Promise.all([loadGrades(), loadAverageGrades()]);
            document.getElementById('gradeForm').reset();
        } else {
            alert('Ошибка при сохранении оценки: ' + (response.message || 'Неизвестная ошибка'));
        }
    });
});

// Обновляем обработчик отправки сообщения
document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStudentId) {
        alert('Выберите студента для чата');
        return;
    }

    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (message) {
        const response = await Api.sendMessage(message, currentStudentId);
        if (response.status === 'success') {
            input.value = '';
            await getMessages();
            // Обновляем счетчики после отправки сообщения
            await updateUnreadCount();
            await updateStudentsUnreadCount();
        } else {
            alert('Ошибка отправки сообщения');
        }
    }
});

async function checkAdminAuth() {
    const response = await Api.checkAdmin();
    if (response.status !== 'success') {
        window.location.href = 'login.html';
    }
}

// Исправляем функцию редактирования курса
async function editCourse(id) {
    const response = await Api.request('get_course_details', { id });
    if (response.status === 'success' && response.course) {
        document.getElementById('courseModalTitle').textContent = 'Редактировать курс';
        document.getElementById('courseId').value = response.course.id;
        document.getElementById('courseTitle').value = response.course.title;
        document.getElementById('courseDescription').value = response.course.description;

        // Создаем новый экземпляр модального окна
        const modal = new bootstrap.Modal(document.getElementById('courseModal'));
        modal.show();
    } else {
        alert(response.message || 'Ошибка при загрузке курса');
    }
}

async function deleteCourse(id) {
    if (confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) {
        const response = await Api.request('delete_course', { id });
        if (response.status === 'success') {
            loadCourses();
        } else {
            alert(response.message || 'Ошибка при удалении курса');
        }
    }
}

async function toggleUserRole(id) {
    const response = await Api.request('toggle_user_role', { id });
    if (response.status === 'success') {
        loadUsers();
    }
}

async function deleteUser(id) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        const response = await Api.request('delete_user', { id });
        if (response.status === 'success') {
            loadUsers();
        }
    }
}

async function logout() {
    const response = await Api.logout();
    if (response.status === 'success') {
        window.location.href = 'login.html';
    }
}

async function editLesson(lessonId) {
    // Получаем данные урока
    const courseId = document.getElementById('lessonCourseId').value;
    const response = await Api.request('get_lesson', { id: lessonId });

    if (response.status === 'success') {
        const lesson = response.lesson;
        // Заполняем форму данными урока
        document.getElementById('lessonId').value = lesson.id;
        document.getElementById('lessonTitle').value = lesson.title;
        document.getElementById('lessonContent').value = lesson.content;
        document.getElementById('lessonOrder').value = lesson.order_num;

        // Показываем форму
        document.getElementById('lessonForm').classList.remove('d-none');
    } else {
        alert('Ошибка при загрузке урока');
    }
}

function showAddMaterialForm() {
    document.getElementById('materialForm').classList.remove('d-none');
    document.getElementById('materialId').value = '';
    document.getElementById('materialTitle').value = '';
    document.getElementById('materialContent').value = '';
    document.getElementById('materialOrder').value = '';
    document.getElementById('materialType').value = 'theory';
}

function hideMaterialForm() {
    document.getElementById('materialForm').classList.add('d-none');
}

document.getElementById('materialForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        lesson_id: document.getElementById('materialLessonId').value,
        title: document.getElementById('materialTitle').value,
        content: document.getElementById('materialContent').value,
        type: document.getElementById('materialType').value,
        order_num: document.getElementById('materialOrder').value
    };

    const materialId = document.getElementById('materialId').value;
    const response = await Api[materialId ? 'updateMaterial' : 'addMaterial'](data);

    if (response.status === 'success') {
        hideMaterialForm();
        await loadMaterials(data.lesson_id);
    }
});

// Модальное окно для редактирования материала
const materialModal = new bootstrap.Modal(document.getElementById('materialModal'));

async function showAddMaterialModal(lessonId) {
    document.getElementById('materialLessonId').value = lessonId;
    document.getElementById('materialId').value = '';
    document.getElementById('materialTitle').value = '';
    document.getElementById('materialContent').value = '';
    document.getElementById('materialType').value = 'theory';
    document.getElementById('materialOrder').value = '';

    materialModal.show();
}

async function editMaterial(materialId) {
    const response = await Api.request('get_material', { id: materialId });
    if (response.status === 'success') {
        const material = response.material;
        document.getElementById('materialId').value = material.id;
        document.getElementById('materialLessonId').value = material.lesson_id;
        document.getElementById('materialTitle').value = material.title;
        document.getElementById('materialContent').value = material.content;
        document.getElementById('materialType').value = material.type;
        document.getElementById('materialOrder').value = material.order_num;

        materialModal.show();
    }
}

async function saveMaterial() {
    try {
        const data = {
            id: document.getElementById('materialId').value,
            lesson_id: document.getElementById('materialLessonId').value,
            title: document.getElementById('materialTitle').value,
            content: document.getElementById('materialContent').value,
            type: document.getElementById('materialType').value,
            order_num: document.getElementById('materialOrder').value || 0
        };

        console.log('Saving material with data:', data);

        const response = await Api[data.id ? 'updateMaterial' : 'addMaterial'](data);
        console.log('Server response:', response);

        if (response.status === 'success') {
            const materialModal = bootstrap.Modal.getInstance(document.getElementById('materialModal'));
            materialModal.hide();
            await loadMaterials(data.lesson_id);
        } else {
            alert('Ошибка при сохранении материала: ' + (response.message || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error saving material:', error);
        alert('Произошла ошибка при сохранении материала');
    }
}

async function deleteMaterial(materialId) {
    if (confirm('Вы уверены, что хотите удалить этот материал?')) {
        try {
            const lessonId = document.getElementById('materialLessonId').value;
            const response = await Api.deleteMaterial(materialId);

            if (response.status === 'success') {
                await loadMaterials(lessonId);
            } else {
                alert('Ошибка при удалении материала: ' + (response.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            alert('Произошла ошибка при удалении материала');
        }
    }
}

function renderCourses(courses) {
    const coursesListElement = document.getElementById('coursesList');
    if (!coursesListElement) return;

    coursesListElement.innerHTML = courses.map(course => `
        <tr>
            <td>${course.id}</td>
            <td>${course.title}</td>
            <td>${course.description}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="manageLessons(${course.id})">Уроки</button>
                <button class="btn btn-sm btn-primary" onclick="editCourse(${course.id})">Редактировать</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCourse(${course.id})">Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Функции для работы с группами
async function loadGroups() {
    const response = await Api.request('get_groups');
    if (response.status === 'success') {
        console.log('Loaded groups:', response.groups); // Отладочная информация

        // Выводим дополнительную информацию о группах
        response.groups.forEach(group => {
            console.log('Group ID:', group.id, 'Type:', typeof group.id);
        });

        document.getElementById('groupsList').innerHTML = response.groups.map(group => `
            <tr>
                <td>${group.name}</td>
                <td>${group.users_count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editGroup(${Number(group.id)})">
                        Редактировать
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGroup(${Number(group.id)})">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        showNotification('error', 'Ошибка при загрузке групп');
    }
}

async function showGroupUsers(groupId) {
    currentGroupId = groupId;
    try {
        // Загружаем информацию о группе и её участниках
        const groupResponse = await Api.request('get_groups');
        const usersResponse = await Api.request('get_users');

        if (groupResponse.status === 'success' && usersResponse.status === 'success') {
            const group = groupResponse.groups.find(g => g.id === parseInt(groupId));
            const allUsers = usersResponse.users.filter(u => u.role === 'user');

            if (group) {
                // Отображаем текущих участников
                const usersList = document.getElementById('groupUsersList');
                if (group.users && group.users.length > 0) {
                    usersList.innerHTML = group.users.map(user => `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>${user.email}</span>
                                <button class="btn btn-sm btn-danger" 
                                    onclick="removeUserFromGroup(${user.id}, ${groupId})">
                                    Удалить
                                </button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    usersList.innerHTML = '<div class="list-group-item">В группе нет участников</div>';
                }

                // Отображаем доступных пользователей
                const availableUsers = allUsers.filter(user =>
                    !group.users.some(groupUser => groupUser.id === user.id)
                );

                const availableUsersList = document.getElementById('availableUsersList');
                if (availableUsers.length > 0) {
                    availableUsersList.innerHTML = availableUsers.map(user => `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>${user.email}</span>
                                <button class="btn btn-sm btn-success" 
                                    onclick="addUserToGroup(${user.id}, ${groupId})">
                                    Добавить
                                </button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    availableUsersList.innerHTML = '<div class="list-group-item">Нет доступных пользователей</div>';
                }

                // Показываем модальное окно
                const modalElement = document.getElementById('groupUsersModal');
                if (!modalElement) {
                    console.error('Modal element not found');
                    return;
                }

                // Создаем новый экземпляр модального окна каждый раз
                const modal = new bootstrap.Modal(modalElement);

                // Удаляем существующие обработчики событий
                modalElement.addEventListener('hidden.bs.modal', () => {
                    modal.dispose();
                });

                setTimeout(() => {
                    modal.show();
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error showing group users:', error);
        alert('Ошибка при загрузке участников группы');
    }
}

// Добавим обработчик поиска пользователей
document.getElementById('userSearchInput')?.addEventListener('input', function (e) {
    const searchText = e.target.value.toLowerCase();
    const userItems = document.querySelectorAll('#availableUsersList .list-group-item');

    userItems.forEach(item => {
        const email = item.querySelector('span').textContent.toLowerCase();
        if (email.includes(searchText)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

async function addUserToGroup(userId, groupId) {
    try {
        const response = await Api.request('add_user_to_group', {
            user_id: userId,
            group_id: groupId
        });

        if (response.status === 'success') {
            await showGroupUsers(groupId);
            await loadGroups();
        } else {
            alert('Ошибка при добавлении пользователя в группу');
        }
    } catch (error) {
        console.error('Error adding user to group:', error);
        alert('Ошибка при добавлении пользователя в группу');
    }
}

async function removeUserFromGroup(userId, groupId) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя из группы?')) {
        try {
            const response = await Api.request('remove_user_from_group', {
                user_id: userId,
                group_id: groupId
            });

            if (response.status === 'success') {
                await showGroupUsers(groupId);
                await loadGroups();
            } else {
                alert('Ошибка при удалении пользователя из группы');
            }
        } catch (error) {
            console.error('Error removing user from group:', error);
            alert('Ошибка при удалении пользователя из группы');
        }
    }
}

// Делаем функции доступными глобально
window.showGroupUsers = showGroupUsers;
window.addUserToGroup = addUserToGroup;
window.removeUserFromGroup = removeUserFromGroup;
window.loadGroups = loadGroups;
window.showCreateGroupModal = showCreateGroupModal;
window.deleteGroup = deleteGroup;

function showCreateGroupModal() {
    try {
        // Очищаем форму
        document.getElementById('groupForm').reset();
        document.getElementById('groupId').value = '';

        // Меняем заголовок и текст кнопки
        document.querySelector('#groupModal .modal-title').textContent = 'Создание группы';
        document.querySelector('#groupModal button[type="submit"]').textContent = 'Создать группу';

        // Загружаем список пользователей
        loadUsersForGroup();

        // Показываем модальное окно
        const modalElement = document.getElementById('groupModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }

        // Закрываем существующее модальное окно, если оно открыто
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }

        // Создаем и показываем новое модальное окно
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        // Добавляем обработчик на закрытие
        modalElement.addEventListener('hidden.bs.modal', () => {
            modal.dispose();
        }, { once: true });

        modal.show();
    } catch (error) {
        console.error('Error showing create group modal:', error);
        alert('Ошибка при открытии модального окна');
    }
}

async function loadUsersForGroup() {
    const response = await Api.request('get_users');
    if (response.status === 'success') {
        const users = response.users.filter(user => user.role === 'user');
        document.getElementById('userCheckboxes').innerHTML = users.map(user => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${user.id}" id="user${user.id}">
                <label class="form-check-label" for="user${user.id}">
                    ${user.email}
                </label>
            </div>
        `).join('');
    }
}

// Обновляем функцию editGroup
async function editGroup(groupId) {
    try {
        console.log('Editing group:', groupId); // Отладочная информация

        // Получаем информацию о группе
        const groupResponse = await Api.request('get_groups');
        console.log('Group response:', groupResponse); // Отладочная информация

        const usersResponse = await Api.request('get_users');
        console.log('Users response:', usersResponse); // Отладочная информация

        if (groupResponse.status === 'success' && usersResponse.status === 'success') {
            // Приводим оба значения к числу для корректного сравнения
            const group = groupResponse.groups.find(g => Number(g.id) === Number(groupId));
            console.log('Found group:', group); // Отладочная информация

            const allUsers = usersResponse.users.filter(u => u.role === 'user');

            if (group) {
                // Заполняем форму данными группы
                document.getElementById('groupName').value = group.name;
                document.getElementById('groupId').value = group.id;

                // Отображаем список пользователей с отмеченными участниками группы
                document.getElementById('userCheckboxes').innerHTML = allUsers.map(user => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${user.id}" 
                            id="user${user.id}" ${group.users && group.users.some(u => Number(u.id) === Number(user.id)) ? 'checked' : ''}>
                        <label class="form-check-label" for="user${user.id}">
                            ${user.email}
                        </label>
                    </div>
                `).join('');

                // Меняем заголовок и текст кнопки
                document.querySelector('#groupModal .modal-title').textContent = 'Редактирование группы';
                document.querySelector('#groupModal button[type="submit"]').textContent = 'Сохранить изменения';

                // Показываем модальное окно
                const modalElement = document.getElementById('groupModal');
                if (!modalElement) {
                    console.error('Modal element not found');
                    return;
                }

                // Создаем новый экземпляр модального окна
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('Group not found:', groupId);
                showNotification('error', 'Группа не найдена');
            }
        } else {
            console.error('Error getting data:', groupResponse.message || usersResponse.message);
            showNotification('error', 'Ошибка при загрузке данных');
        }
    } catch (error) {
        console.error('Error editing group:', error);
        showNotification('error', 'Ошибка при редактировании группы');
    }
}

// Добавляем функцию deleteGroup, если её нет
async function deleteGroup(groupId) {
    if (confirm('Вы уверены, что хотите удалить эту группу?')) {
        const response = await Api.request('delete_group', { group_id: groupId });
        if (response.status === 'success') {
            loadGroups();
        } else {
            alert('Ошибка при удалении группы');
        }
    }
}

// Экспортируем все необходимые функции в глобальную область видимости
window.editGroup = editGroup;
window.deleteGroup = deleteGroup;
window.loadGroups = loadGroups;
window.showCreateGroupModal = showCreateGroupModal;

// Добавим функции для работы с оценками
async function loadGradesData() {
    await Promise.all([
        loadGrades(),
        loadAverageGrades(),
        loadStudentsForGrades(),
        loadLessonsForGrades(),
        loadGroupAverageGrades()
    ]);
}

async function loadGrades() {
    const response = await Api.request('get_grades');
    if (response.status === 'success') {
        const gradesList = document.getElementById('gradesList');
        if (gradesList) {
            gradesList.innerHTML = response.grades.map(grade => `
                <tr>
                    <td>${grade.user_email}</td>
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
                    <td>
                        <button class="btn btn-sm btn-danger" 
                                onclick="deleteGrade(${grade.user_id}, ${grade.lesson_id})">
                            Удалить
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

async function loadAverageGrades() {
    const response = await Api.request('get_average_grades');
    if (response.status === 'success') {
        // Заполняем выпадающий список студентов
        const studentSelect = document.getElementById('studentGradesSelect');
        studentSelect.innerHTML = `
            <option value="">Выберите студента</option>
            ${response.averages.map(student => `
                <option value="${student.user_id}" 
                    data-grades='${JSON.stringify(student)}'>
                    ${student.user_email}
                </option>
            `).join('')}
        `;

        // Добавляем обработчик изменения выбранного студента
        studentSelect.addEventListener('change', showSelectedStudentGrades);
    }
}

function showSelectedStudentGrades(event) {
    const selectedOption = event.target.selectedOptions[0];
    const gradesContainer = document.getElementById('selectedStudentGrades');

    if (!selectedOption.value) {
        gradesContainer.classList.add('d-none');
        return;
    }

    const studentData = JSON.parse(selectedOption.dataset.grades);

    // Показываем контейнер
    gradesContainer.classList.remove('d-none');

    // Обновляем общую статистику
    document.getElementById('overallGrade').textContent = studentData.overall_average;
    document.getElementById('totalGrades').textContent = studentData.total_grades;

    // Обновляем оценки по курсам
    document.getElementById('courseGradesList').innerHTML = studentData.courses.map(course => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${course.course_title}</strong>
                <small class="text-muted">(${course.grades_count} оценок)</small>
            </div>
            <span class="badge bg-primary">${course.average}</span>
        </div>
    `).join('') || '<p class="text-muted">Нет оценок по курсам</p>';
}

async function loadStudentsForGrades() {
    const response = await Api.request('get_users');
    if (response.status === 'success') {
        const students = response.users.filter(user => user.role === 'user');
        document.getElementById('gradeStudentSelect').innerHTML = `
            <option value="">Выберите студента</option>
            ${students.map(student => `
                <option value="${student.id}">${student.email}</option>
            `).join('')}
        `;
    }
}

async function loadLessonsForGrades() {
    const response = await Api.request('get_courses');
    if (response.status === 'success') {
        let lessonsHtml = '<option value="">Выберите урок</option>';
        for (const course of response.courses) {
            const courseDetails = await Api.request('get_course_details', { id: course.id });
            if (courseDetails.status === 'success' && courseDetails.lessons) {
                lessonsHtml += `
                    <optgroup label="${course.title}">
                        ${courseDetails.lessons.map(lesson => `
                            <option value="${lesson.id}">${lesson.title}</option>
                        `).join('')}
                    </optgroup>
                `;
            }
        }
        document.getElementById('gradeLessonSelect').innerHTML = lessonsHtml;
    }
}

// Добавим функцию удаления оценки
async function deleteGrade(userId, lessonId) {
    if (confirm('Вы уверены, что хотите удалить эту оценку?')) {
        const response = await Api.request('delete_grade', {
            user_id: userId,
            lesson_id: lessonId
        });

        if (response.status === 'success') {
            // Обновляем списки оценок
            await Promise.all([loadGrades(), loadAverageGrades()]);
        } else {
            alert('Ошибка при удалении оценки');
        }
    }
}

// Добавим функцию в глобальную область видимости
window.deleteGrade = deleteGrade;

// Добавим новую функцию для загрузки средних оценок групп
async function loadGroupAverageGrades() {
    const response = await Api.request('get_group_average_grades');
    if (response.status === 'success') {
        // Заполняем выпадающий список групп
        const groupSelect = document.getElementById('groupGradesSelect');
        groupSelect.innerHTML = `
            <option value="">Выберите группу</option>
            ${response.groups.map(group => `
                <option value="${group.group_name}" 
                    data-grades='${JSON.stringify(group)}'>
                    ${group.group_name}
                </option>
            `).join('')}
        `;

        // Добавляем обработчик изменения выбранной группы
        groupSelect.addEventListener('change', showSelectedGroupGrades);
    }
}

function showSelectedGroupGrades(event) {
    const selectedOption = event.target.selectedOptions[0];
    const gradesContainer = document.getElementById('selectedGroupGrades');

    if (!selectedOption.value) {
        gradesContainer.classList.add('d-none');
        return;
    }

    const groupData = JSON.parse(selectedOption.dataset.grades);

    // Показываем контейнер
    gradesContainer.classList.remove('d-none');

    // Обновляем статистику группы
    document.getElementById('groupStudentsCount').textContent = groupData.students_count;

    // Обновляем оценки по курсам
    document.getElementById('groupCoursesList').innerHTML = groupData.courses.map(course => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${course.course_title}</strong>
                <small class="text-muted">(${course.grades_count} оценок)</small>
            </div>
            <span class="badge ${getBadgeClass(course.average)}">
                ${course.average}
            </span>
        </div>
    `).join('');
}

// Обновляем стили в style.css
function getBadgeClass(average) {
    if (average === 'Нет оценок') return 'bg-secondary';
    const numericAverage = parseFloat(average);
    if (numericAverage >= 4.5) return 'bg-success';
    if (numericAverage >= 3.5) return 'bg-primary';
    if (numericAverage >= 2.5) return 'bg-warning';
    return 'bg-danger';
}

async function updateGrade(input) {
    const userId = input.dataset.userId;
    const lessonId = input.dataset.lessonId;
    const grade = parseFloat(input.value);

    if (grade < 0 || grade > 5) {
        alert('Оценка должна быть от 0 до 5');
        return;
    }

    const response = await Api.setGrade(userId, lessonId, grade);
    if (response.status === 'success') {
        // Обновляем все списки оценок
        await Promise.all([
            loadGrades(),
            loadAverageGrades(),
            loadGroupAverageGrades()
        ]);

        // Показываем уведомление об успехе
        showNotification('success', 'Оценка успешно сохранена');
    } else {
        // Показываем уведомление об ошибке
        showNotification('error', response.message || 'Ошибка при сохранении оценки');
        // Возвращаем предыдущее значение
        input.value = input.defaultValue;
    }
}

// Добавим функцию для показа уведомлений
function showNotification(type, message) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notificationDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notificationDiv);

    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => {
        notificationDiv.remove();
    }, 3000);
}

// Добавим функцию для обновления всех данных об оценках
async function refreshGradesData() {
    await Promise.all([
        loadGrades(),
        loadAverageGrades(),
        loadGroupAverageGrades()
    ]);
}

// Добавим обработчик для обновления данных при переключении на вкладку оценок
document.querySelector('a[href="#grades"]').addEventListener('click', refreshGradesData);