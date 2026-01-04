require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { handleStart } = require('./commands/start');
const { handleOrders } = require('./commands/orders');
const { handleStatusCallback } = require('./handlers/callback');
const { isAuthorized } = require('./utils/auth');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Middleware для проверки доступа
const checkAuth = (handler) => {
	return async (bot, msgOrQuery) => {
		const chatId = msgOrQuery.message?.chat?.id || msgOrQuery.chat?.id;
		
		if (!isAuthorized(chatId)) {
			const chatIdToNotify = msgOrQuery.message?.chat?.id || msgOrQuery.chat?.id;
			if (chatIdToNotify) {
				await bot.sendMessage(
					chatIdToNotify,
					'❌ Доступ запрещен. Обратитесь к администратору.'
				);
			}
			return;
		}
		
		return handler(bot, msgOrQuery);
	};
};

// Команды с проверкой доступа
bot.onText(/\/start/, checkAuth(handleStart));
bot.onText(/\/orders/, checkAuth(handleOrders));

// Обработка текстовых сообщений (кнопки reply keyboard)
bot.on('message', async (msg) => {
	const chatId = msg.chat.id;
	const text = msg.text;

	if (!isAuthorized(chatId)) {
		return;
	}

	// Игнорируем команды (они обрабатываются отдельно)
	if (text && text.startsWith('/')) {
		return;
	}

	// Обработка нажатий на кнопки
	if (text === '📦 Все заказы') {
		await handleOrders(bot, msg);
	} else if (text === '✅ Отправленные') {
		const { sendOrdersList } = require('./commands/orders');
		await sendOrdersList(bot, chatId, 'sent');
	} else if (text === '⏳ Не отправленные') {
		const { sendOrdersList } = require('./commands/orders');
		await sendOrdersList(bot, chatId, 'not_sent');
	}
});

// Callback queries (кнопки) с проверкой доступа
bot.on('callback_query', (query) => {
	if (!isAuthorized(query.message.chat.id)) {
		return bot.answerCallbackQuery(query.id, {
			text: '❌ Доступ запрещен',
			show_alert: true
		});
	}
	handleStatusCallback(bot, query);
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');

