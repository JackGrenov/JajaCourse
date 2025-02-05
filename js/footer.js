function showContactModal() {
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
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
            bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
            this.reset();
        } else {
            alert('Ошибка при отправке сообщения: ' + response.message);
        }
    } catch (error) {
        alert('Произошла ошибка при отправке сообщения');
    }
}); 