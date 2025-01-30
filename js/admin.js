let courseModal;
let lessonsModal;
let currentStudentId = null;
let chatInterval;

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
                    <a href="#" class="list-group-item list-group-item-action" 
                       onclick="selectStudent(${student.id}, '${student.email}')">
                        ${student.email}
                    </a>
                `).join('');
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
    }
}

// Добавим очистку интервала при переключении вкладок
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (chatInterval) {
            clearInterval(chatInterval);
            chatInterval = null;
        }
    });
});

// Добавим очистку интервала при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (chatInterval) {
        clearInterval(chatInterval);
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

    // Проверяем права и загружаем данные только один раз при загрузке страницы
    checkAdminAuth().then(() => {
        // Загружаем начальные данные
        loadData();
    });

    // Добавляем обработчики для очистки интервала чата при переключении вкладок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (chatInterval) {
                clearInterval(chatInterval);
                chatInterval = null;
            }
        });
    });

    // Добавляем очистку интервала при закрытии страницы
    window.addEventListener('beforeunload', () => {
        if (chatInterval) {
            clearInterval(chatInterval);
        }
    });
});

// Оставляем только один обработчик формы чата
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

async function ш(id) {
    const response = await Api.request('get_course_details', { id });
    if (response.status === 'success' && response.course) {
        document.getElementById('courseModalTitle').textContent = 'Редактировать курс';
        document.getElementById('courseId').value = response.course.id;
        document.getElementById('courseTitle').value = response.course.title;
        document.getElementById('courseDescription').value = response.course.description;
        
        // Используем существующий экземпляр модального окна
        const modalElement = document.getElementById('courseModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
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