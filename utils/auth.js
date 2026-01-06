require('dotenv').config();

// Логируем загруженные переменные окружения при старте (только для отладки)
console.log(
	'📋 Loaded ALLOWED_CHAT_IDS:',
	process.env.ALLOWED_CHAT_IDS || 'NOT SET'
);

/**
 * Проверка доступа пользователя к боту
 * @param {number} chatId - ID чата пользователя
 * @returns {boolean} - true если доступ разрешен
 */
const isAuthorized = (chatId) => {
	if (!chatId) {
		console.log('❌ No chatId provided');
		return false;
	}

	const allowedChatIds = process.env.ALLOWED_CHAT_IDS;

	if (!allowedChatIds) {
		console.warn('⚠️  ALLOWED_CHAT_IDS not set, denying access');
		return false;
	}

	// Логируем для отладки
	console.log(`🔍 Auth check - Raw ALLOWED_CHAT_IDS: "${allowedChatIds}"`);

	const allowedIds = allowedChatIds
		.split(',')
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
	const chatIdStr = String(chatId);

	console.log(`🔍 Auth check - Parsed IDs: [${allowedIds.join(', ')}]`);
	console.log(
		`🔍 Auth check - Checking chatId: "${chatIdStr}" (type: ${typeof chatIdStr})`
	);

	const isAllowed = allowedIds.includes(chatIdStr);

	if (isAllowed) {
		console.log(`✅ Access granted for chatId: ${chatIdStr}`);
	} else {
		console.log(
			`❌ Access denied for chatId: ${chatIdStr}. Allowed IDs: [${allowedIds.join(
				', '
			)}]`
		);
	}

	return isAllowed;
};

module.exports = { isAuthorized };
