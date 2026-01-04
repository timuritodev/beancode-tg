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

const getRecentOrders = async (limit = 10, status = null) => {
  try {
    // MySQL2 не поддерживает плейсхолдеры для LIMIT, поэтому используем интерполяцию
    // limit - это контролируемое значение из кода, не пользовательский ввод, поэтому безопасно
    const safeLimit = parseInt(limit, 10) || 10;
    
    let query = 'SELECT * FROM orders';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY id DESC LIMIT ${safeLimit}`;
    
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

