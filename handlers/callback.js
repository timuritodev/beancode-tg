const { updateOrderStatus, getOrderById } = require('../utils/db');

const handleStatusCallback = async (bot, query) => {
	try {
		if (!query || !query.data || !query.message) {
			console.error('Invalid callback query:', query);
			return;
		}

		const chatId = query.message.chat.id;
		const data = query.data;

		if (data.startsWith('toggle_status_')) {
			const orderId = parseInt(data.replace('toggle_status_', ''));

			try {
				const order = await getOrderById(orderId);
				if (!order) {
					return bot.answerCallbackQuery(query.id, {
						text: 'Заказ не найден',
						show_alert: true,
					});
				}

				const newStatus = order.status === 'sent' ? 'not_sent' : 'sent';
				await updateOrderStatus(orderId, newStatus);

				const statusText =
					newStatus === 'sent' ? '✅ Отправлен' : '⏳ Не отправлен';
				await bot.answerCallbackQuery(query.id, {
					text: `Статус изменен: ${statusText}`,
					show_alert: false,
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
					inline_keyboard: [
						[
							{
								text: statusText,
								callback_data: `toggle_status_${order.id}`,
							},
						],
					],
				};

				await bot.editMessageText(message, {
					chat_id: chatId,
					message_id: query.message.message_id,
					parse_mode: 'HTML',
					reply_markup: keyboard,
				});
			} catch (error) {
				console.error('Error in handleStatusCallback:', error);
				bot.answerCallbackQuery(query.id, {
					text: 'Ошибка при обновлении статуса',
					show_alert: true,
				});
			}
		}
	} catch (error) {
		console.error('Error in handleStatusCallback:', error);
		if (query && query.id) {
			try {
				await bot.answerCallbackQuery(query.id, {
					text: 'Произошла ошибка',
					show_alert: false,
				});
			} catch (e) {
				// Игнорируем ошибку ответа на callback
			}
		}
	}
};

module.exports = { handleStatusCallback };
