require('dotenv').config();

/**
 * Проверка доступа пользователя к боту
 * @param {number} chatId - ID чата пользователя
 * @returns {boolean} - true если доступ разрешен
 */
const isAuthorized = (chatId) => {
	if (!chatId) {
		return false;
	}

	const allowedChatIds = process.env.ALLOWED_CHAT_IDS;

	if (!allowedChatIds) {
		console.warn('⚠️  ALLOWED_CHAT_IDS not set, denying access');
		return false;
	}

	const allowedIds = allowedChatIds.split(',').map((id) => id.trim());
	const chatIdStr = String(chatId);

	return allowedIds.includes(chatIdStr);
};

module.exports = { isAuthorized };
