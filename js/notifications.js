// Функция для обновления счетчика непрочитанных сообщений
async function updateUnreadMessagesCount() {
    try {
        const response = await Api.getUnreadMessagesCount();
        console.log('Unread messages response:', response); // Отладочная информация

        if (response.status === 'success') {
            const badge = document.getElementById('unreadBadge');
            if (badge) {
                if (response.count > 0) {
                    badge.textContent = response.count;
                    badge.classList.remove('d-none');
                    console.log('Showing badge with count:', response.count);
                } else {
                    badge.classList.add('d-none');
                    console.log('Hiding badge');
                }
            } else {
                console.log('Badge element not found');
            }
        } else {
            console.error('Error getting unread messages:', response.message);
        }
    } catch (error) {
        console.error('Error in updateUnreadMessagesCount:', error);
    }
}

// Запускаем проверку при загрузке страницы и каждые 30 секунд
document.addEventListener('DOMContentLoaded', () => {
    updateUnreadMessagesCount();
    setInterval(updateUnreadMessagesCount, 30000);
});