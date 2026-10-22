import { verifyAccessToken } from '../utils/token.util.js';
import { UnauthenticatedError } from '../utils/errors.util.js';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try reading from httpOnly cookie
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // 2. Fallback to Authorization: Bearer <token>
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthenticatedError('Authentication token missing');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthenticatedError('Access token has expired', 'TOKEN_EXPIRED');
      }
      throw new UnauthenticatedError('Invalid access token');
    }

    // 3. Verify user in database, active status, deleted_at, and token_version
    const users = await query(
      `SELECT id, name, email, role, area_id, store_id, is_active, token_version, deleted_at
       FROM users
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [decoded.sub]
    );

    if (!users || users.length === 0) {
      throw new UnauthenticatedError('User account not found or deactivated');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new UnauthenticatedError('User account is deactivated');
    }

    if (user.token_version !== decoded.tv) {
      throw new UnauthenticatedError('Token is no longer valid. Please log in again.');
    }

    // 4. Attach normalized user to req.user
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      areaId: user.area_id,
      storeId: user.store_id,
      tokenVersion: user.token_version,
    };

    next();
  } catch (error) {
    next(error);
  }
};
