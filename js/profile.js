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
    } else {
        window.location.href = 'login.html';
    }
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