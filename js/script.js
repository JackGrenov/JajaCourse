let currentCourseId;
let currentLessonId;

async function loadCourse() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('id');

    if (!currentCourseId) {
        window.location.href = 'index.html';
        return;
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

// Заменяем два обработчика на один
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
            // Обновляем только прогресс курса, без перезагрузки всего списка
            const progressResponse = await Api.getProgress(currentCourseId);
            if (progressResponse.status === 'success') {
                // Здесь можно обновить отображение прогресса, если оно есть на странице
            }
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