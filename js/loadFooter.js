function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    fetch('../includes/footer.html')
        .then(response => response.text())
        .then(html => {
            footerContainer.innerHTML = html;
            
            // Применяем текущую тему
            applyCurrentTheme();
            
            // Инициализируем обработчики после загрузки футера
            initializeFooterHandlers();
        })
        .catch(error => console.error('Ошибка загрузки футера:', error));
}

function applyCurrentTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function initializeFooterHandlers() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        message: document.getElementById('contactMessage').value
    };
    
    try {
        const response = await Api.request('send_contact', formData);
        if (response.status === 'success') {
            alert('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
            if (modal) modal.hide();
            this.reset();
        } else {
            alert('Ошибка при отправке сообщения: ' + response.message);
        }
    } catch (error) {
        alert('Произошла ошибка при отправке сообщения');
    }
}

document.addEventListener('DOMContentLoaded', loadFooter);

// Обработчик изменения темы для всего документа
window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
        applyCurrentTheme();
    }
}); 