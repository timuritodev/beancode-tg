const { getRecentOrders } = require('../utils/db');

const sendOrdersList = async (bot, chatId, status = null, limit = 50) => {
  try {
    const orders = await getRecentOrders(limit, status);
    
    if (orders.length === 0) {
      const statusText = status === 'sent' ? 'отправленных' : status === 'not_sent' ? 'не отправленных' : '';
      return bot.sendMessage(chatId, `📭 Нет ${statusText} заказов`);
    }
    
    // Отправляем сообщение с кнопками фильтрации
    const filterKeyboard = {
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
    
    const statusLabel = status === 'sent' ? '✅ Отправленные' : status === 'not_sent' ? '⏳ Не отправленные' : '📦 Все заказы';
    await bot.sendMessage(chatId, `${statusLabel} (найдено: ${orders.length}):`, {
      reply_markup: filterKeyboard,
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
    console.error('Error in sendOrdersList:', error);
    bot.sendMessage(chatId, '❌ Ошибка при получении заказов');
  }
};

const handleOrders = async (bot, msg) => {
  const chatId = msg.chat.id;
  await sendOrdersList(bot, chatId);
};

module.exports = { handleOrders, sendOrdersList };

