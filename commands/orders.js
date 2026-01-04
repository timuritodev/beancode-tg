const { getRecentOrders } = require('../utils/db');

const sendOrdersList = async (bot, chatId, status = null, limit = 50) => {
  try {
    const orders = await getRecentOrders(limit, status);
    
    if (orders.length === 0) {
      const statusText = status === 'sent' ? 'отправленных' : status === 'not_sent' ? 'не отправленных' : '';
      return bot.sendMessage(chatId, `📭 Нет ${statusText} заказов`);
    }
    
    // Reply keyboard (постоянная клавиатура внизу)
    const replyMarkup = {
      keyboard: [
        [{ text: '📦 Все заказы' }],
        [{ text: '✅ Отправленные' }, { text: '⏳ Не отправленные' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };
    
    const statusLabel = status === 'sent' ? '✅ Отправленные' : status === 'not_sent' ? '⏳ Не отправленные' : '📦 Все заказы';
    await bot.sendMessage(chatId, `${statusLabel} (найдено: ${orders.length}):`, {
      reply_markup: replyMarkup,
    });
    
    // Отправляем каждый заказ
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
      
      const inlineKeyboard = {
        inline_keyboard: [[
          {
            text: order.status === 'sent' ? '✅ Отправлен' : '⏳ Не отправлен',
            callback_data: `toggle_status_${order.id}`
          }
        ]]
      };
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
    }
    
    // Отправляем reply keyboard в конце, чтобы она осталась видимой
    await bot.sendMessage(chatId, '👇 Используйте кнопки ниже:', {
      reply_markup: replyMarkup,
    });
  } catch (error) {
    console.error('Error in sendOrdersList:', error);
    bot.sendMessage(chatId, '❌ Ошибка при получении заказов');
  }
};

const handleOrders = async (bot, msg) => {
  const chatId = msg.chat.id;
  await sendOrdersList(bot, chatId);
};

module.exports = { handleOrders, sendOrdersList };

