import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.util.js';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'roxy_store_db';

export const initializeDatabase = async () => {
  let connection;
  try {
    // 1. Connect without db to ensure database exists
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.changeUser({ database: DB_NAME });

    logger.info(`Database "${DB_NAME}" ready. Initializing tables...`);

    const columnExists = async (table, col) => {
      const [rows] = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [DB_NAME, table, col]
      );
      return rows.length > 0;
    };

    // 2. Table: areas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id VARCHAR(36) PRIMARY KEY,
        external_id INT NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) DEFAULT NULL,
        lat DECIMAL(10,8) DEFAULT NULL,
        lng DECIMAL(11,8) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        synced_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_areas_is_active (is_active),
        INDEX idx_areas_external_id (external_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Table: stores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(36) PRIMARY KEY,
        external_id INT NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        area_id VARCHAR(36) NOT NULL,
        lat DECIMAL(10,8) DEFAULT NULL,
        lng DECIMAL(11,8) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        synced_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_stores_area_id (area_id),
        INDEX idx_stores_is_active (is_active),
        INDEX idx_stores_external_id (external_id),
        CONSTRAINT fk_stores_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ================== Non-Destructive Migrations ==================
    // Migrate areas table
    if (!(await columnExists('areas', 'external_id'))) {
      logger.info('Migrating areas: adding external_id column...');
      await connection.query(`ALTER TABLE areas ADD COLUMN external_id INT NULL`);
      const [existingAreas] = await connection.query(`SELECT id, name FROM areas WHERE external_id IS NULL`);
      let syntheticAreaId = -100;
      for (const a of existingAreas) {
        if (a.name === 'New Cairo') {
          await connection.query(`UPDATE areas SET external_id = 77 WHERE id = ?`, [a.id]);
        } else if (a.name === 'Nasr City') {
          await connection.query(`UPDATE areas SET external_id = 78 WHERE id = ?`, [a.id]);
        } else if (a.name === 'Heliopolis') {
          await connection.query(`UPDATE areas SET external_id = 79 WHERE id = ?`, [a.id]);
        } else {
          await connection.query(`UPDATE areas SET external_id = ? WHERE id = ?`, [syntheticAreaId--, a.id]);
        }
      }
      await connection.query(`ALTER TABLE areas MODIFY COLUMN external_id INT NOT NULL UNIQUE`);
    }
    if (!(await columnExists('areas', 'slug'))) {
      await connection.query(`ALTER TABLE areas ADD COLUMN slug VARCHAR(255) NULL`);
    }
    if (!(await columnExists('areas', 'lat'))) {
      await connection.query(`ALTER TABLE areas ADD COLUMN lat DECIMAL(10,8) NULL`);
    }
    if (!(await columnExists('areas', 'lng'))) {
      await connection.query(`ALTER TABLE areas ADD COLUMN lng DECIMAL(11,8) NULL`);
    }
    if (!(await columnExists('areas', 'is_active'))) {
      await connection.query(`ALTER TABLE areas ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`);
      await connection.query(`ALTER TABLE areas ADD INDEX idx_areas_is_active (is_active)`);
    }
    if (!(await columnExists('areas', 'synced_at'))) {
      await connection.query(`ALTER TABLE areas ADD COLUMN synced_at TIMESTAMP NULL`);
    }

    // Migrate stores table
    if (!(await columnExists('stores', 'external_id'))) {
      logger.info('Migrating stores: adding external_id column...');
      await connection.query(`ALTER TABLE stores ADD COLUMN external_id INT NULL`);
      const [existingStores] = await connection.query(`SELECT id FROM stores WHERE external_id IS NULL`);
      let syntheticStoreId = -200;
      for (const s of existingStores) {
        await connection.query(`UPDATE stores SET external_id = ? WHERE id = ?`, [syntheticStoreId--, s.id]);
      }
      await connection.query(`ALTER TABLE stores MODIFY COLUMN external_id INT NOT NULL UNIQUE`);
    }
    if (!(await columnExists('stores', 'lat'))) {
      await connection.query(`ALTER TABLE stores ADD COLUMN lat DECIMAL(10,8) NULL`);
    }
    if (!(await columnExists('stores', 'lng'))) {
      await connection.query(`ALTER TABLE stores ADD COLUMN lng DECIMAL(11,8) NULL`);
    }
    if (!(await columnExists('stores', 'synced_at'))) {
      await connection.query(`ALTER TABLE stores ADD COLUMN synced_at TIMESTAMP NULL`);
    }

    // 4. Table: users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,

        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('OPERATION_MANAGER', 'AREA_MANAGER', 'STORE_MANAGER', 'STORE_USER') NOT NULL,
        area_id VARCHAR(36) DEFAULT NULL,
        store_id VARCHAR(36) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by_id VARCHAR(36) DEFAULT NULL,
        failed_login_count INT DEFAULT 0,
        locked_until DATETIME DEFAULT NULL,
        last_login_at DATETIME DEFAULT NULL,
        token_version INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME DEFAULT NULL,
        UNIQUE KEY uq_users_email (email),
        UNIQUE KEY uq_users_phone (phone),
        INDEX idx_users_role (role),
        INDEX idx_users_area_id (area_id),
        INDEX idx_users_store_id (store_id),
        INDEX idx_users_is_active (is_active),
        INDEX idx_users_deleted_at (deleted_at),
        CONSTRAINT fk_users_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
        CONSTRAINT fk_users_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
        CONSTRAINT fk_users_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Table: refresh_tokens
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        family_id VARCHAR(36) NOT NULL,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME DEFAULT NULL,
        replaced_by_id VARCHAR(36) DEFAULT NULL,
        user_agent VARCHAR(500) DEFAULT NULL,
        ip VARCHAR(45) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_refresh_tokens_user_id (user_id),
        INDEX idx_refresh_tokens_token_hash (token_hash),
        INDEX idx_refresh_tokens_family_id (family_id),
        CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Table: audit_logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) DEFAULT NULL,
        target_id VARCHAR(36) DEFAULT NULL,
        details JSON DEFAULT NULL,
        ip VARCHAR(45) DEFAULT NULL,
        user_agent VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_logs_user_id (user_id),
        INDEX idx_audit_logs_action (action),
        INDEX idx_audit_logs_created_at (created_at),
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    logger.info('Database tables initialized successfully');
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
