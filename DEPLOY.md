# Деплой Telegram бота на продакшен

## Шаг 1: Подготовка на сервере

1. Создайте директорию для бота на сервере:
```bash
mkdir -p ~/beancode-tg
cd ~/beancode-tg
```

2. Клонируйте репозиторий (или скопируйте файлы):
```bash
git clone <your-repo-url> .
# или
# Загрузите файлы через scp/sftp
```

## Шаг 2: Установка зависимостей

```bash
cd ~/beancode-tg
npm install --production
```

## Шаг 3: Настройка .env файла

Создайте файл `.env` в корне проекта:

```bash
nano ~/beancode-tg/.env
```

Добавьте следующие переменные:
```
TELEGRAM_BOT_TOKEN=8467958051:AAFowKvqv-ydHJuWh6BqQBAKSrsgzR3ruFE
TELEGRAM_CHAT_ID=320700693

# Database configuration (те же что и в API)
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=timur2003
DB_NAME=coffee
```

**Важно:** Используйте те же данные БД, что и в основном API, так как бот работает с той же базой данных.

## Шаг 4: Создание директории для логов

```bash
mkdir -p ~/beancode-tg/logs
```

## Шаг 5: Запуск через PM2

### Вариант 1: Используя PM2 конфиг

```bash
cd ~/beancode-tg
pm2 start pm2.config.cjs
pm2 save
```

### Вариант 2: Прямой запуск

```bash
cd ~/beancode-tg
pm2 start index.js --name beancode-telegram-bot
pm2 save
```

## Шаг 6: Проверка статуса

```bash
pm2 list
pm2 logs beancode-telegram-bot
```

Вы должны увидеть:
```
┌────┬──────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                 │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼──────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ app                  │ fork     │ 1    │ online    │ 0%       │ 80.8mb   │
│ 1  │ beancode-frontend…   │ fork     │ 8    │ online    │ 0%       │ 293.3mb  │
│ 2  │ beancode-telegram-bot│ fork     │ 0    │ online    │ 0%       │ 50.0mb   │
└────┴──────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

## Полезные команды PM2

```bash
# Просмотр логов
pm2 logs beancode-telegram-bot

# Просмотр логов в реальном времени
pm2 logs beancode-telegram-bot --lines 50

# Перезапуск бота
pm2 restart beancode-telegram-bot

# Остановка бота
pm2 stop beancode-telegram-bot

# Удаление из PM2
pm2 delete beancode-telegram-bot

# Мониторинг
pm2 monit
```

## Обновление бота

Когда нужно обновить код:

```bash
cd ~/beancode-tg

# Если используете git:
git pull origin main

# Установите новые зависимости (если есть)
npm install --production

# Перезапустите бота
pm2 restart beancode-telegram-bot
```

## Автозапуск при перезагрузке сервера

Если еще не настроено:
```bash
pm2 startup
pm2 save
```

## Проверка работы

1. Откройте Telegram и найдите вашего бота
2. Отправьте команду `/start`
3. Должны появиться кнопки фильтрации заказов
4. Попробуйте команду `/orders`

## Устранение проблем

### Бот не запускается

1. Проверьте логи:
```bash
pm2 logs beancode-telegram-bot --err
```

2. Проверьте .env файл:
```bash
cat ~/beancode-tg/.env
```

3. Проверьте подключение к БД:
```bash
# Убедитесь что БД доступна с того же хоста
mysql -h 127.0.0.1 -u root -p coffee
```

### Бот не отвечает

1. Проверьте токен бота в .env
2. Проверьте что бот запущен: `pm2 list`
3. Проверьте логи на ошибки: `pm2 logs beancode-telegram-bot`

