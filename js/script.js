let currentCourseId;
let currentLessonId;

async function loadCourse() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('id');

    if (!currentCourseId) {
        window.location.href = 'index.html';
        return;
    }

    // Проверяем роль пользователя
    const authResponse = await Api.request('check_auth');
    const isAdmin = authResponse.status === 'success' && authResponse.role === 'admin';

    if (!isAdmin) {
        // Проверяем принадлежность к группе только для обычных пользователей
        const groupResponse = await Api.request('get_user_group');
        if (!groupResponse.group) {
            alert('У вас нет доступа к этому курсу. Обратитесь к администратору для добавления в группу.');
            window.location.href = 'index.html';
            return;
        }
    }

    const response = await Api.getCourseDetails(currentCourseId);
    if (response.status === 'success') {
        // Отображаем список уроков
        document.getElementById('lessonsList').innerHTML = response.lessons.map(lesson => `
                    <a href="#" 
                       class="list-group-item list-group-item-action ${parseInt(lesson.completed) === 1 ? 'lesson-completed' : ''}"
                       data-lesson-id="${lesson.id}"
                       onclick="loadLesson(${lesson.id})">
                        ${lesson.title}
                    </a>
                `).join('');

        // Отображаем среднюю оценку, если она есть и пользователь не админ
        const averageGradeBlock = document.getElementById('averageGradeBlock');
        const averageGrade = document.getElementById('averageGrade');
        
        if (!isAdmin && response.average_grade) {
            averageGrade.textContent = response.average_grade;
            averageGradeBlock.classList.remove('d-none');
        } else {
            averageGradeBlock.classList.add('d-none');
        }

        // Находим первый урок по порядковому номеру
        const firstLesson = response.lessons.find(lesson => lesson.order_num === 1);
        if (firstLesson) {
            // Загружаем первый урок
            await loadLesson(firstLesson.id);
        } else if (response.lessons.length > 0) {
            // Если урока с order_num = 1 нет, загружаем первый из списка
            await loadLesson(response.lessons[0].id);
        }
    }
}

async function loadLesson(lessonId) {
    currentLessonId = lessonId;

    // Загружаем информацию об уроке
    const lessonResponse = await Api.getLesson(lessonId);
    if (lessonResponse.status === 'success') {
        const lesson = lessonResponse.lesson;
        document.getElementById('lessonTitle').textContent = lesson.title;

        // Обновляем состояние кнопки
        const toggleButton = document.getElementById('lessonToggle');
        if (parseInt(lesson.completed) === 1) {
            toggleButton.classList.remove('btn-success');
            toggleButton.classList.add('btn-secondary');
            toggleButton.textContent = 'Отметить как не пройденный';
        } else {
            toggleButton.classList.remove('btn-secondary');
            toggleButton.classList.add('btn-success');
            toggleButton.textContent = 'Отметить как пройденный';
        }

        // Обновляем активный элемент в списке
        document.querySelectorAll('#lessonsList .list-group-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.getAttribute('data-lesson-id')) === lessonId) {
                item.classList.add('active');
            }
        });
    }

    // Загружаем материалы урока
    const materialsResponse = await Api.getLessonMaterials(lessonId);
    if (materialsResponse.status === 'success') {
        const materials = materialsResponse.materials;

        // Разделяем материалы на теорию и практику
        const theory = materials.filter(m => m.type === 'theory');
        const practice = materials.filter(m => m.type === 'practice');

        // Отображаем теоретические материалы
        document.getElementById('theoryMaterials').innerHTML = theory.map(material => `
                    <div class="material-card">
                        <h5>${material.title}</h5>
                        <div class="material-content">
                            ${formatContent(material.content)}
                        </div>
                    </div>
                `).join('');

        // Отображаем практические материалы
        document.getElementById('practiceMaterials').innerHTML = practice.map(material => `
                    <div class="material-card">
                        <h5>${material.title}</h5>
                        <div class="material-content">
                            ${formatContent(material.content)}
                        </div>
                    </div>
                `).join('');
    }
}

// Функция для форматирования контента (обработка кода и разметки)
function formatContent(content) {
    // Заменяем блоки кода
    content = content.replace(/```([\s\S]*?)```/g, '<div class="code-block">$1</div>');
    // Заменяем переносы строк на <br>
    content = content.replace(/\n/g, '<br>');
    return content;
}

// Функция для обновления прогресс-бара курса
async function updateCourseProgress() {
    if (!currentCourseId) return;
    
    const response = await Api.getProgress(currentCourseId);
    if (response.status === 'success') {
        // Находим прогресс-бар на главной странице
        const progressBar = document.querySelector(`[data-course-id="${currentCourseId}"] .progress-bar`);
        if (progressBar) {
            progressBar.style.width = `${response.progress}%`;
            progressBar.textContent = `${response.progress}%`;
        }
    }
}

// Обновляем обработчик переключения статуса урока
document.getElementById('lessonToggle').addEventListener('click', async function () {
    if (currentCourseId && currentLessonId) {
        const isCompleted = this.classList.contains('btn-secondary');
        const response = await Api.request('toggle_lesson', {
            course_id: currentCourseId,
            lesson_id: currentLessonId,
            completed: !isCompleted
        });

        if (response.status === 'success') {
            const lessonItem = document.querySelector(`[data-lesson-id="${currentLessonId}"]`);
            if (lessonItem) {
                if (!isCompleted) { // Меняем на "пройден"
                    lessonItem.classList.add('lesson-completed');
                    this.classList.remove('btn-success');
                    this.classList.add('btn-secondary');
                    this.textContent = 'Отметить как не пройденный';
                } else { // Меняем на "не пройден"
                    lessonItem.classList.remove('lesson-completed');
                    this.classList.remove('btn-secondary');
                    this.classList.add('btn-success');
                    this.textContent = 'Отметить как пройденный';
                }
            }
            
            // Обновляем прогресс-бар
            await updateCourseProgress();
        } else {
            alert('Ошибка при обновлении статуса урока');
        }
    }
});

async function checkAuth() {
    const response = await Api.request('check_auth');
    if (response.status !== 'success') {
        window.location.href = 'login.html';
    } else {
        loadCourse();
    }
}

async function logout() {
    const response = await Api.logout();
    if (response.status === 'success') {
        window.location.href = 'login.html';
    }
}

// Инициализация
checkAuth();

// Загрузка курсов
async function loadCourses() {
    const response = await Api.request('get_courses');
    const authResponse = await Api.request('check_auth');
    const isAdmin = authResponse.status === 'success' && authResponse.role === 'admin';

    let groupResponse = { group: null };
    if (!isAdmin) {
        groupResponse = await Api.request('get_user_group');
    }

    if (response.status === 'success') {
        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = response.courses.map(course => {
            const isBlocked = !isAdmin && !groupResponse.group; // Блокируем только для обычных пользователей без группы
            return `
            <div class="col-12 col-sm-6 col-lg-4 mb-4">
                <div class="card h-100" data-course-id="${course.id}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        <div class="progress mb-3 ${isBlocked ? 'disabled' : ''}" ${isBlocked ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                            <div class="progress-bar" role="progressbar" style="width: ${course.progress}%" data-course-id="${course.id}">
                                ${course.progress}%
                            </div>
                        </div>
                        ${isBlocked ?
                    `<div class="alert alert-warning mb-0 mt-auto w-100">Курс заблокирован. Обратитесь к администратору для добавления в группу.</div>` :
                    `<button class="btn btn-primary w-100 mt-auto" onclick="window.location.href='course.html?id=${course.id}'">
                                Начать обучение
                            </button>`
                }
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}