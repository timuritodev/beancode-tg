# Beancode Telegram Bot

Telegram бот для управления заказами.

## Установка

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env` в корне проекта со следующим содержимым:

```
TELEGRAM_BOT_TOKEN=8467958051:AAFowKvqv-ydHJuWh6BqQBAKSrsgzR3ruFE

# Защита бота - список разрешенных Chat ID (через запятую, ОБЯЗАТЕЛЬНО!)
ALLOWED_CHAT_IDS=320700693
# Можно указать несколько: ALLOWED_CHAT_IDS=320700693,123456789,987654321

# Database configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=timur2003
DB_NAME=coffee
```

**Важно:** Добавьте свой Chat ID в `ALLOWED_CHAT_IDS` для доступа к боту. Можно указать несколько через запятую: `ALLOWED_CHAT_IDS=320700693,123456789`

## Запуск

### Режим разработки:

```bash
npm run dev
```

### Продакшн:

```bash
npm start
```

### С PM2 (локально):

```bash
pm2 start index.js --name telegram-bot
pm2 save
```

### С PM2 (продакшен):

```bash
pm2 start pm2.config.cjs
pm2 save
```

**Подробная инструкция по деплою:** см. [DEPLOY.md](./DEPLOY.md)

## Команды бота

- `/start` - Приветственное сообщение
- `/orders` - Показать последние 10 заказов

## Структура проекта

```
beancode-tg/
├── package.json
├── index.js          # Основной файл бота
├── .env              # Переменные окружения (не коммитится)
├── commands/
│   ├── start.js      # Обработчик команды /start
│   └── orders.js     # Обработчик команды /orders
├── handlers/
│   └── callback.js   # Обработчик callback queries (кнопки)
└── utils/
    └── db.js         # Работа с базой данных
```
