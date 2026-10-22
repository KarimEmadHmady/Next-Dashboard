import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { logger } from './logger.util.js';

export const logAudit = async ({
  userId = null,
  action,
  targetType = null,
  targetId = null,
  details = null,
  req = null,
}) => {
  try {
    const id = uuidv4();
    const ip = req ? (req.headers['x-forwarded-for'] || req.ip || null) : null;
    const userAgent = req ? (req.headers['user-agent'] || null) : null;
    const detailsJson = details ? JSON.stringify(details) : null;

    await query(
      `INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, action, targetType, targetId, detailsJson, ip, userAgent]
    );
  } catch (error) {
    // Non-blocking: audit failure should log an error but not crash the main business operation
    logger.error(`Audit log failed for action "${action}":`, error.message);
  }
};
