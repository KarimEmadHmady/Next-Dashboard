import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { comparePassword, hashPassword, validatePasswordStrength } from '../../utils/password.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../utils/token.util.js';
import {
  UnauthenticatedError,
  AccountLockedError,
  ValidationError,
} from '../../utils/errors.util.js';
import { AllowedPagesByRole } from '../../config/roles.js';
import { RolePermissions } from '../../config/permissions.js';
import { logAudit } from '../../utils/auditLogger.util.js';

export class AuthService {
  /**
   * Login user with credentials and brute-force protection
   */
  static async login({ email, password, ip, userAgent }) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user by email
    const users = await query(
      `SELECT id, name, email, phone, password_hash, role, area_id, store_id, is_active,
              failed_login_count, locked_until, token_version
       FROM users
       WHERE email = ? AND deleted_at IS NULL
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = users[0];

    // If user exists, check if account is locked
    if (user && user.locked_until) {
      const lockExpiresAt = new Date(user.locked_until);
      if (lockExpiresAt > new Date()) {
        const remainingMinutes = Math.ceil((lockExpiresAt - new Date()) / 60000);
        await logAudit({
          userId: user.id,
          action: 'LOGIN_ATTEMPT_LOCKED_ACCOUNT',
          targetType: 'AUTH',
          details: { email: normalizedEmail, remainingMinutes },
          ip,
          userAgent,
        });
        throw new AccountLockedError(
          `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`
        );
      }
    }

    // 2. Validate password
    const isPasswordValid = user ? await comparePassword(password, user.password_hash) : false;

    if (!user || !isPasswordValid) {
      if (user) {
        const newCount = (user.failed_login_count || 0) + 1;
        let lockUntil = null;

        if (newCount >= 5) {
          // Lock for 15 minutes
          lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await query(
            `UPDATE users SET failed_login_count = 0, locked_until = ? WHERE id = ?`,
            [lockUntil, user.id]
          );
        } else {
          await query(
            `UPDATE users SET failed_login_count = ? WHERE id = ?`,
            [newCount, user.id]
          );
        }

        await logAudit({
          userId: user.id,
          action: 'LOGIN_FAILED',
          targetType: 'AUTH',
          details: { email: normalizedEmail, failedCount: newCount, locked: !!lockUntil },
          ip,
          userAgent,
        });
      }

      // Always return generic error message for security
      throw new UnauthenticatedError('Invalid email or password');
    }

    // 3. Check if account is active
    if (!user.is_active) {
      await logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED_DEACTIVATED',
        targetType: 'AUTH',
        details: { email: normalizedEmail },
        ip,
        userAgent,
      });
      throw new UnauthenticatedError('Account is deactivated. Please contact your manager.');
    }

    // 4. Reset failed attempts & set last login
    await query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?`,
      [user.id]
    );

    // 5. Generate Access Token & Refresh Token
    const accessToken = generateAccessToken(user);
    const { rawToken: refreshToken, tokenHash, expiresAt } = generateRefreshToken();
    const tokenId = uuidv4();
    const familyId = uuidv4();

    await query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at, user_agent, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tokenId, user.id, tokenHash, familyId, expiresAt, userAgent, ip]
    );

    // 6. Audit log login success
    await logAudit({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      targetType: 'AUTH',
      details: { email: user.email, role: user.role },
      ip,
      userAgent,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      areaId: user.area_id,
      storeId: user.store_id,
    };

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      allowedPages: AllowedPagesByRole[user.role] || [],
      permissions: RolePermissions[user.role] || [],
    };
  }

  /**
   * Rotate Refresh Token with reuse detection
   */
  static async refresh({ rawRefreshToken, ip, userAgent }) {
    if (!rawRefreshToken) {
      throw new UnauthenticatedError('Refresh token required');
    }

    const tokenHash = hashToken(rawRefreshToken);

    // Fetch token from DB
    const tokens = await query(
      `SELECT rt.id, rt.user_id, rt.family_id, rt.expires_at, rt.revoked_at,
              u.id as user_id, u.name, u.email, u.role, u.area_id, u.store_id, u.is_active, u.token_version
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [tokenHash]
    );

    if (!tokens || tokens.length === 0) {
      throw new UnauthenticatedError('Invalid refresh token');
    }

    const tokenRecord = tokens[0];

    // Reuse detection: if token is already revoked, compromise detected!
    if (tokenRecord.revoked_at) {
      // Invalidate the entire family
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = ?`,
        [tokenRecord.family_id]
      );

      await logAudit({
        userId: tokenRecord.user_id,
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        targetType: 'AUTH',
        details: { familyId: tokenRecord.family_id },
        ip,
        userAgent,
      });

      throw new UnauthenticatedError('Invalid refresh token. All sessions revoked for security.');
    }

    // Check expiration
    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new UnauthenticatedError('Refresh token has expired', 'TOKEN_EXPIRED');
    }

    // Check user active status
    if (!tokenRecord.is_active) {
      throw new UnauthenticatedError('Account is deactivated');
    }

    // Rotate: Issue new tokens, revoke old token
    const newAccessToken = generateAccessToken(tokenRecord);
    const { rawToken: newRefreshToken, tokenHash: newTokenHash, expiresAt: newExpiresAt } = generateRefreshToken();
    const newTokenId = uuidv4();

    // Revoke old token and link to new one
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by_id = ? WHERE id = ?`,
      [newTokenId, tokenRecord.id]
    );

    // Insert new token into same family
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at, user_agent, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newTokenId, tokenRecord.user_id, newTokenHash, tokenRecord.family_id, newExpiresAt, userAgent, ip]
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout single session
   */
  static async logout({ rawRefreshToken, userId, ip, userAgent }) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?`,
        [tokenHash]
      );
    }

    await logAudit({
      userId,
      action: 'LOGOUT',
      targetType: 'AUTH',
      ip,
      userAgent,
    });

    return true;
  }

  /**
   * Logout all sessions by incrementing token_version & revoking all refresh tokens
   */
  static async logoutAll({ userId, ip, userAgent }) {
    await query(
      `UPDATE users SET token_version = token_version + 1 WHERE id = ?`,
      [userId]
    );

    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`,
      [userId]
    );

    await logAudit({
      userId,
      action: 'LOGOUT_ALL',
      targetType: 'AUTH',
      ip,
      userAgent,
    });

    return true;
  }

  /**
   * Get authenticated user profile with allowed pages and permissions
   */
  static async getMe(userId) {
    const users = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.area_id as areaId, u.store_id as storeId,
              u.is_active as isActive, u.last_login_at as lastLoginAt, u.created_at as createdAt,
              a.name as areaName, a.external_id as areaExternalId,
              s.name as storeName, s.external_id as storeExternalId
       FROM users u
       LEFT JOIN areas a ON u.area_id = a.id
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) {
      throw new UnauthenticatedError('User account not found');
    }

    const user = users[0];

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        areaId: user.areaId,
        areaName: user.areaName || null,
        area: user.areaId
          ? {
              id: user.areaId,
              name: user.areaName,
              externalId: user.areaExternalId !== null && user.areaExternalId !== undefined ? Number(user.areaExternalId) : null,
            }
          : null,
        storeId: user.storeId,
        storeName: user.storeName || null,
        store: user.storeId
          ? {
              id: user.storeId,
              name: user.storeName,
              externalId: user.storeExternalId !== null && user.storeExternalId !== undefined ? Number(user.storeExternalId) : null,
            }
          : null,
        isActive: !!user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      allowedPages: AllowedPagesByRole[user.role] || [],
      permissions: RolePermissions[user.role] || [],
    };
  }


  /**
   * Change password with old password verification and token invalidation
   */
  static async changePassword({ userId, currentPassword, newPassword, ip, userAgent }) {
    if (!validatePasswordStrength(newPassword)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }

    const users = await query(
      `SELECT id, password_hash FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) {
      throw new UnauthenticatedError('User not found');
    }

    const user = users[0];
    const isCurrentValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHashed = await hashPassword(newPassword);

    // Update password, increment token_version to invalidate existing access tokens
    await query(
      `UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`,
      [newHashed, userId]
    );

    // Revoke all refresh tokens
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`,
      [userId]
    );

    await logAudit({
      userId,
      action: 'PASSWORD_CHANGE',
      targetType: 'AUTH',
      ip,
      userAgent,
    });

    return true;
  }
}
