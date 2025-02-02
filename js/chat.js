document.addEventListener('DOMContentLoaded', async () => {
    await loadMessages();
    setupChat();

    // Отмечаем сообщения как прочитанные при открытии чата
    await Api.request('mark_messages_as_read');
    // Обновляем счетчик
    updateUnreadMessagesCount();
});

// В функции loadMessages добавим обновление счетчика после получения новых сообщений
async function loadMessages() {
    const response = await Api.getMessages(lastMessageId);
    if (response.status === 'success') {
        // ... существующий код ...

        // Отмечаем сообщения как прочитанные и обновляем счетчик
        await Api.request('mark_messages_as_read');
        updateUnreadMessagesCount();
    }
}