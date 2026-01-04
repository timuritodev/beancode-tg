# Настройка Telegram бота для менеджеров

## Архитектура решения

### Рекомендуемая структура:
1. **Отдельный репозиторий** для бота (например, `beancode-telegram-bot`)
2. **Размещение на том же сервере** как отдельный процесс (PM2)
3. **Использование polling** (проще, чем webhook для начала)

### Что нужно сделать:

## 1. Создать поле status в таблице orders

Выполните SQL миграцию:

```sql
ALTER TABLE orders 
ADD COLUMN status VARCHAR(50) DEFAULT 'not_sent' 
AFTER date_order;

-- Возможные значения: 'not_sent', 'sent'
```

## 2. Создать Telegram бота

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и получите токен бота
4. Добавьте токен в `.env` файл API:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

## 3. Получить Chat ID

1. Напишите боту [@userinfobot](https://t.me/userinfobot)
2. Он покажет ваш Chat ID
3. Или создайте группу, добавьте бота и получите ID группы

## 4. Создать отдельный репозиторий для бота

### Структура проекта:
```
beancode-telegram-bot/
├── package.json
├── .env
├── index.js
├── bot.js
├── commands/
│   ├── start.js
│   ├── orders.js
│   └── status.js
├── handlers/
│   └── callback.js
└── utils/
    └── db.js
```

### package.json:
```json
{
  "name": "beancode-telegram-bot",
  "version": "1.0.0",
  "description": "Telegram bot for order management",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "node-telegram-bot-api": "^0.64.0",
    "mysql2": "^3.6.0",
    "dotenv": "^16.3.1"
  }
}
```

### index.js (основной файл):
```javascript
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { handleStart } = require('./commands/start');
const { handleOrders } = require('./commands/orders');
const { handleStatusCallback } = require('./handlers/callback');

const token = process.env.TELEGRAM_BOT_TOKEN;
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
```

### commands/orders.js:
```javascript
const { getRecentOrders } = require('../utils/db');

const handleOrders = async (bot, msg) => {
  const chatId = msg.chat.id;
  
  try {
    const orders = await getRecentOrders(10); // Последние 10 заказов
    
    if (orders.length === 0) {
      return bot.sendMessage(chatId, '📭 Нет новых заказов');
    }
    
    for (const order of orders) {
      const statusEmoji = order.status === 'sent' ? '✅' : '⏳';
      const message = `
📦 <b>Заказ #${order.orderNumber}</b>
👤 ${order.email}
📞 ${order.phone}
📍 ${order.city}, ${order.address}
💰 ${order.sum} ₽
${statusEmoji} Статус: ${order.status === 'sent' ? 'Отправлен' : 'Не отправлен'}

<i>ID: ${order.id}</i>
      `.trim();
      
      const keyboard = {
        inline_keyboard: [[
          {
            text: order.status === 'sent' ? '✅ Отправлен' : '⏳ Не отправлен',
            callback_data: `toggle_status_${order.id}`
          }
        ]]
      };
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    }
  } catch (error) {
    console.error('Error in handleOrders:', error);
    bot.sendMessage(chatId, '❌ Ошибка при получении заказов');
  }
};

module.exports = { handleOrders };
```

### handlers/callback.js:
```javascript
const { updateOrderStatus, getOrderById } = require('../utils/db');

const handleStatusCallback = async (bot, query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('toggle_status_')) {
    const orderId = parseInt(data.replace('toggle_status_', ''));
    
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        return bot.answerCallbackQuery(query.id, {
          text: 'Заказ не найден',
          show_alert: true
        });
      }
      
      const newStatus = order.status === 'sent' ? 'not_sent' : 'sent';
      await updateOrderStatus(orderId, newStatus);
      
      const statusText = newStatus === 'sent' ? '✅ Отправлен' : '⏳ Не отправлен';
      await bot.answerCallbackQuery(query.id, {
        text: `Статус изменен: ${statusText}`,
        show_alert: false
      });
      
      // Обновляем сообщение
      const statusEmoji = newStatus === 'sent' ? '✅' : '⏳';
      const message = `
📦 <b>Заказ #${order.orderNumber}</b>
👤 ${order.email}
📞 ${order.phone}
📍 ${order.city}, ${order.address}
💰 ${order.sum} ₽
${statusEmoji} Статус: ${newStatus === 'sent' ? 'Отправлен' : 'Не отправлен'}

<i>ID: ${order.id}</i>
      `.trim();
      
      const keyboard = {
        inline_keyboard: [[
          {
            text: statusText,
            callback_data: `toggle_status_${order.id}`
          }
        ]]
      };
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error in handleStatusCallback:', error);
      bot.answerCallbackQuery(query.id, {
        text: 'Ошибка при обновлении статуса',
        show_alert: true
      });
    }
  }
};

module.exports = { handleStatusCallback };
```

### utils/db.js:
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const getRecentOrders = async (limit = 10) => {
  const [rows] = await pool.execute(
    'SELECT * FROM orders ORDER BY id DESC LIMIT ?',
    [limit]
  );
  return rows;
};

const getOrderById = async (orderId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM orders WHERE id = ? LIMIT 1',
    [orderId]
  );
  return rows[0] || null;
};

const updateOrderStatus = async (orderId, status) => {
  await pool.execute(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId]
  );
};

module.exports = {
  getRecentOrders,
  getOrderById,
  updateOrderStatus
};
```

## 5. Развертывание на сервере

### С PM2:
```bash
cd beancode-telegram-bot
npm install
pm2 start index.js --name telegram-bot
pm2 save
pm2 startup
```

### С systemd:
Создайте файл `/etc/systemd/system/telegram-bot.service`:
```ini
[Unit]
Description=Beancode Telegram Bot
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/beancode-telegram-bot
ExecStart=/usr/bin/node index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl enable telegram-bot
sudo systemctl start telegram-bot
```

## 6. Безопасность

1. **Ограничьте доступ к боту** - используйте whitelist chat IDs
2. **Храните токены в .env** - не коммитьте в git
3. **Используйте переменные окружения** для всех секретов

## Альтернативный вариант (без отдельного репозитория)

Если не хотите отдельный репозиторий, можно добавить бота в текущий API:
- Создать `routes/telegram-bot.js`
- Запускать бота в отдельном процессе через `child_process` или PM2

Но **рекомендую отдельный репозиторий** - это чище и проще поддерживать.

