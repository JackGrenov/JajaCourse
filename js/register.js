document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }

    const response = await Api.register(email, password);
    if (response.status === 'success') {
        alert('Регистрация успешна!');
        window.location.href = 'login.html';
    } else {
        alert(response.message);
    }
});