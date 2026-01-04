require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { handleStart } = require('./commands/start');
const { handleOrders } = require('./commands/orders');
const { handleStatusCallback } = require('./handlers/callback');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Команды
bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/orders/, (msg) => handleOrders(bot, msg));

// Callback queries (кнопки)
bot.on('callback_query', (query) => handleStatusCallback(bot, query));

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');

