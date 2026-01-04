const handleStart = async (bot, msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 <b>Добро пожаловать в бот управления заказами!</b>

Используйте кнопки ниже для управления заказами.
  `.trim();

  // Reply keyboard (постоянная клавиатура внизу)
  const keyboard = {
    keyboard: [
      [
        { text: '📦 Все заказы' },
      ],
      [
        { text: '✅ Отправленные' },
        { text: '⏳ Не отправленные' },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
};

module.exports = { handleStart };

