# Быстрый деплой бота

## На сервере выполните:

```bash
# 1. Создайте директорию
mkdir -p ~/beancode-tg
cd ~/beancode-tg

# 2. Загрузите файлы (через git, scp или другой способ)
# Например через scp с локальной машины:
# scp -r /Users/timurito/dev/beancode/beancode-tg/* beancode@your-server:~/beancode-tg/

# 3. Установите зависимости
npm install --production

# 4. Создайте .env файл
cat > .env << EOF

# 5. Создайте директорию для логов
mkdir -p logs

# 6. Запустите через PM2
pm2 start pm2.config.cjs
pm2 save

# 7. Проверьте статус
pm2 list
pm2 logs beancode-telegram-bot
```

## Проверка работы

Откройте Telegram, найдите бота и отправьте `/start`
