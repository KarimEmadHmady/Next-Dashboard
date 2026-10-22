import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { query } from '../config/db.js';
import { hashPassword } from '../utils/password.util.js';
import { Roles } from '../config/roles.js';
import { logger } from '../utils/logger.util.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@roxy.com').toLowerCase().trim();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@Password123';
    const adminName = process.env.SEED_ADMIN_NAME || 'System Super Admin';

    // 1. Check if Operation Manager already exists
    const existingAdmins = await query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [adminEmail]
    );

    if (existingAdmins.length === 0) {
      const hashedPassword = await hashPassword(adminPassword);
      const adminId = uuidv4();

      await query(
        `INSERT INTO users (id, name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [adminId, adminName, adminEmail, hashedPassword, Roles.OPERATION_MANAGER, true]
      );

      logger.info(`Initial OPERATION_MANAGER seeded successfully: ${adminEmail}`);
    } else {
      logger.info(`OPERATION_MANAGER already exists: ${adminEmail}`);
    }

    // 2. Note: Areas and stores are synced from the external WordPress system via sync.service.js
    return true;

  } catch (error) {
    logger.error('Database seeding failed:', error.message);
    throw error;
  }
};
