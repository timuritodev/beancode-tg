require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { handleStart } = require('./commands/start');
const { handleOrders, sendOrdersList } = require('./commands/orders');
const { handleStatusCallback } = require('./handlers/callback');
const { isAuthorized } = require('./utils/auth');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
	console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле');
	process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Настройка команд бота (появляются в кнопке меню)
bot
	.setMyCommands([
		{ command: 'start', description: 'Запустить бота' },
		{ command: 'orders', description: 'Показать все заказы' },
		{ command: 'sent', description: 'Показать отправленные заказы' },
		{ command: 'not_sent', description: 'Показать не отправленные заказы' },
	])
	.catch((err) => console.error('Error setting commands:', err));

// Настройка кнопки меню бота через прямой API вызов
const https = require('https');
const setMenuButton = () => {
	const data = JSON.stringify({
		menu_button: {
			type: 'commands',
		},
	});

	const options = {
		hostname: 'api.telegram.org',
		path: `/bot${token}/setChatMenuButton`,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(data, 'utf8'),
		},
	};

	const req = https.request(options, (res) => {
		let responseData = '';
		res.on('data', (chunk) => {
			responseData += chunk;
		});
		res.on('end', () => {
			if (res.statusCode === 200) {
				console.log('✅ Bot menu button configured');
			} else {
				console.error('❌ Error setting menu button:', responseData);
			}
		});
	});

	req.on('error', (error) => {
		console.error('Error setting menu button:', error);
	});

	req.write(data);
	req.end();
};

setMenuButton();

// Middleware для проверки доступа
const checkAuth = (handler) => {
	return async (bot, msg) => {
		try {
			const chatId = msg.chat?.id;

			if (!chatId) {
				return;
			}

			if (!isAuthorized(chatId)) {
				await bot.sendMessage(
					chatId,
					'❌ Доступ запрещен. Обратитесь к администратору.'
				);
				return;
			}

			return await handler(bot, msg);
		} catch (error) {
			console.error('Error in checkAuth middleware:', error);
		}
	};
};

// Команды с проверкой доступа
bot.onText(/\/start/, (msg) => checkAuth(handleStart)(bot, msg));
bot.onText(/\/orders/, (msg) => checkAuth(handleOrders)(bot, msg));
bot.onText(/\/sent/, (msg) =>
	checkAuth(() => sendOrdersList(bot, msg.chat.id, 'sent'))(bot, msg)
);
bot.onText(/\/not_sent/, (msg) =>
	checkAuth(() => sendOrdersList(bot, msg.chat.id, 'not_sent'))(bot, msg)
);

// Обработка текстовых сообщений (кнопки reply keyboard)
bot.on('message', async (msg) => {
	try {
		// Игнорируем команды (они обрабатываются через onText)
		if (msg.text && msg.text.startsWith('/')) {
			return;
		}

		// Игнорируем сообщения без текста
		if (!msg.text) {
			return;
		}

		const chatId = msg.chat.id;

		if (!isAuthorized(chatId)) {
			return;
		}

		// Обработка нажатий на кнопки reply keyboard
		if (msg.text === '📦 Все заказы') {
			await handleOrders(bot, msg);
		} else if (msg.text === '✅ Отправленные') {
			const { sendOrdersList } = require('./commands/orders');
			await sendOrdersList(bot, chatId, 'sent');
		} else if (msg.text === '⏳ Не отправленные') {
			const { sendOrdersList } = require('./commands/orders');
			await sendOrdersList(bot, chatId, 'not_sent');
		}
	} catch (error) {
		console.error('Error handling message:', error);
	}
});

// Callback queries (кнопки) с проверкой доступа
bot.on('callback_query', async (query) => {
	try {
		if (!query || !query.message || !query.message.chat) {
			console.error('Invalid callback query:', query);
			return;
		}

		const chatId = query.message.chat.id;

		if (!isAuthorized(chatId)) {
			return await bot.answerCallbackQuery(query.id, {
				text: '❌ Доступ запрещен',
				show_alert: true,
			});
		}

		await handleStatusCallback(bot, query);
	} catch (error) {
		console.error('Error handling callback_query:', error);
		if (query && query.id) {
			try {
				await bot.answerCallbackQuery(query.id, {
					text: 'Произошла ошибка',
					show_alert: false,
				});
			} catch (e) {
				// Игнорируем ошибку
			}
		}
	}
});

// Обработка ошибок
bot.on('polling_error', (error) => {
	console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');
