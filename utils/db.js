const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'timur2003',
  database: process.env.DB_NAME || 'coffee',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Получить заказы с фильтрацией по статусу и периоду
 * @param {number|null} limit - Лимит записей (null = без лимита)
 * @param {string|null} status - Статус заказа ('sent' или 'not_sent')
 * @param {string|null} period - Период для выполненных заказов: 'day', 'week', 'month', 'year', null (все)
 * @returns {Promise<Array>}
 */
const getRecentOrders = async (limit = 10, status = null, period = null) => {
  try {
    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];
    
    // Фильтр по статусу
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    // Фильтр по периоду (только для выполненных заказов)
    if (status === 'sent' && period) {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        conditions.push('date_order >= ?');
        params.push(startDate.toISOString().split('T')[0]);
      }
    }
    
    // Для невыполненных заказов - без лимита и без сортировки (или сортировка по id ASC)
    if (status === 'not_sent') {
      query += conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
      query += ' ORDER BY id ASC'; // С начала деятельности
    } else {
      // Для выполненных заказов - сортировка по дате DESC
      query += conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
      query += ' ORDER BY date_order DESC, id DESC';
      
      // Лимит только для выполненных заказов
      if (limit !== null) {
        const safeLimit = parseInt(limit, 10) || 10;
        query += ` LIMIT ${safeLimit}`;
      }
    }
    
    const [rows] = await pool.execute(query, params);
    return rows || [];
  } catch (error) {
    console.error('Error in getRecentOrders:', error);
    throw error;
  }
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

