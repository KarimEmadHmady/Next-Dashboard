import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.util.js';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'roxy_store_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Helper to query with clean error reporting
export const query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Test connection
export const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('Connected to MySQL database successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Failed to connect to MySQL database:', error.message);
    return false;
  }
};
