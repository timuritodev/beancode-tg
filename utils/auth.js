require('dotenv').config();

/**
 * Проверка доступа пользователя к боту
 * @param {number} chatId - ID чата пользователя
 * @returns {boolean} - true если доступ разрешен
 */
const isAuthorized = (chatId) => {
	let allowedChatIds = process.env.ALLOWED_CHAT_IDS;

	// Если ALLOWED_CHAT_IDS не указан, используем TELEGRAM_CHAT_ID как дефолтный
	if (!allowedChatIds) {
		allowedChatIds = process.env.TELEGRAM_CHAT_ID;

		if (!allowedChatIds) {
			// Если и TELEGRAM_CHAT_ID нет, разрешаем всем (небезопасно!)
			console.warn(
				'⚠️  ALLOWED_CHAT_IDS and TELEGRAM_CHAT_ID not set, allowing all users'
			);
			return true;
		}
	}

	const allowedIds = allowedChatIds.split(',').map((id) => id.trim());
	const chatIdStr = String(chatId);

	return allowedIds.includes(chatIdStr);
};

module.exports = { isAuthorized };
