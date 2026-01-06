const { getRecentOrders } = require('../utils/db');

/**
 * Отправка списка заказов
 * @param {Object} bot - Экземпляр бота
 * @param {number} chatId - ID чата
 * @param {string|null} status - Статус заказа ('sent' или 'not_sent')
 * @param {string|null} period - Период для выполненных заказов: 'day', 'week', 'month', 'year', null
 */
const sendOrdersList = async (bot, chatId, status = null, period = null) => {
  try {
    // Для невыполненных заказов - без лимита (все с начала деятельности)
    // Для выполненных заказов - по умолчанию месяц, если период не указан
    const limit = status === 'not_sent' ? null : 1000; // Большой лимит для выполненных
    const actualPeriod = status === 'sent' && !period ? 'month' : period;
    
    const orders = await getRecentOrders(limit, status, actualPeriod);
    
    if (orders.length === 0) {
      const statusText = status === 'sent' ? 'отправленных' : status === 'not_sent' ? 'не отправленных' : '';
      const periodText = actualPeriod === 'day' ? ' за день' : 
                         actualPeriod === 'week' ? ' за неделю' : 
                         actualPeriod === 'month' ? ' за месяц' : 
                         actualPeriod === 'year' ? ' с начала года' : '';
      return bot.sendMessage(chatId, `📭 Нет ${statusText} заказов${periodText}`);
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
    
    // Формируем заголовок с информацией о периоде
    let statusLabel = status === 'sent' ? '✅ Отправленные' : status === 'not_sent' ? '⏳ Не отправленные' : '📦 Все заказы';
    if (status === 'sent' && actualPeriod) {
      const periodLabels = {
        'day': ' (за день)',
        'week': ' (за неделю)',
        'month': ' (за месяц)',
        'year': ' (с начала года)'
      };
      statusLabel += periodLabels[actualPeriod] || '';
    }
    
    // Для выполненных заказов добавляем inline кнопки выбора периода
    let inlineKeyboard = null;
    if (status === 'sent') {
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '📅 День', callback_data: 'filter_sent_day' },
            { text: '📅 Неделя', callback_data: 'filter_sent_week' },
          ],
          [
            { text: '📅 Месяц', callback_data: 'filter_sent_month' },
            { text: '📅 Год', callback_data: 'filter_sent_year' },
          ]
        ]
      };
    }
    
    await bot.sendMessage(chatId, `${statusLabel} (найдено: ${orders.length}):`, {
      reply_markup: replyMarkup,
      ...(inlineKeyboard && { parse_mode: 'HTML' })
    });
    
    // Если есть inline кнопки, отправляем их отдельным сообщением
    if (inlineKeyboard) {
      await bot.sendMessage(chatId, '📅 Выберите период:', {
        reply_markup: inlineKeyboard
      });
    }
    
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

