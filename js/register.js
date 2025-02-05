document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Очищаем предыдущие сообщения об ошибках
    clearErrors();

    // Валидация на стороне клиента
    if (!email || !password || !confirmPassword) {
        showError('Все поля обязательны для заполнения');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Некорректный формат email');
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    try {
        const response = await Api.register(email, password);
        if (response.status === 'success') {
            showSuccess('Регистрация успешна! Сейчас вы будете перенаправлены на страницу входа.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showError(response.message || 'Ошибка при регистрации');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
    }
});

// Вспомогательные функции
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('registerForm').prepend(alertDiv);
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('registerForm').prepend(alertDiv);
}

function clearErrors() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
}