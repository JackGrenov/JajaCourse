document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await Api.login(email, password);
    if (response.status === 'success') {
        window.location.href = 'index.html';
    } else {
        alert(response.message);
    }
});