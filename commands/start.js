const handleStart = async (bot, msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 <b>Добро пожаловать в бот управления заказами!</b>

Выберите действие:
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📦 Все заказы', callback_data: 'filter_all' },
      ],
      [
        { text: '✅ Отправленные', callback_data: 'filter_sent' },
        { text: '⏳ Не отправленные', callback_data: 'filter_not_sent' },
      ],
    ],
  };

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
};

module.exports = { handleStart };

