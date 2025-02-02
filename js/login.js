document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await Api.login(email, password);
    if (response.status === 'success') {
        // Сохраняем роль пользователя в localStorage для дополнительной проверки
        localStorage.setItem('userRole', response.role);
        window.location.href = response.role === 'admin' ? 'admin.html' : 'index.html';
    } else {
        alert(response.message);
    }
});