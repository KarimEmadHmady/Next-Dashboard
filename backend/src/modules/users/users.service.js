import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { hashPassword, validatePasswordStrength } from '../../utils/password.util.js';
import { Roles } from '../../config/roles.js';
import { canManageUser, canCreateUser } from '../../policies/user.policy.js';
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../../utils/errors.util.js';
import { logAudit } from '../../utils/auditLogger.util.js';

export class UsersService {
  /**
   * Create a new user with strict scoping & permission checks
   */
  static async createUser({ actor, userData, ip, userAgent }) {
    let { name, email, phone, password, role, areaId, storeId } = userData;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Resolve areaId & storeId based on target role
    if (role === Roles.OPERATION_MANAGER) {
      areaId = null;
      storeId = null;
    } else if (role === Roles.AREA_MANAGER) {
      if (!areaId && actor.role === Roles.OPERATION_MANAGER) {
        throw new ValidationError('areaId is required for AREA_MANAGER');
      }
      if (areaId) {
        const areas = await query(`SELECT id, is_active FROM areas WHERE id = ? LIMIT 1`, [areaId]);
        if (areas.length === 0) {
          throw new ValidationError('Specified area does not exist');
        }
        if (!areas[0].is_active) {
          throw new ValidationError('Specified area is inactive in the mirror');
        }
      }
      storeId = null;
    } else if (role === Roles.STORE_MANAGER || role === Roles.STORE_USER) {
      // If store manager creating store user, force storeId
      if (actor.role === Roles.STORE_MANAGER) {
        storeId = actor.storeId;
      }
      if (!storeId) {
        throw new ValidationError(`storeId is required for ${role}`);
      }

      // Fetch store to verify it exists, is active, and inherit its area_id
      const stores = await query(
        `SELECT s.id, s.area_id, s.is_active as isStoreActive, a.is_active as isAreaActive 
         FROM stores s 
         JOIN areas a ON s.area_id = a.id 
         WHERE s.id = ? LIMIT 1`,
        [storeId]
      );
      if (stores.length === 0) {
        throw new ValidationError('Specified store does not exist');
      }
      if (!stores[0].isStoreActive) {
        throw new ValidationError('Specified store is inactive in the mirror');
      }
      if (!stores[0].isAreaActive) {
        throw new ValidationError('Specified store belongs to an inactive area');
      }
      areaId = stores[0].area_id;
    }

    // If Area Manager, force areaId to actor's areaId
    if (actor.role === Roles.AREA_MANAGER) {
      areaId = actor.areaId;
      // If storeId is supplied, verify it belongs to this Area Manager's area and is active
      if (storeId) {
        const stores = await query(
          `SELECT id, is_active FROM stores WHERE id = ? AND area_id = ? LIMIT 1`,
          [storeId, actor.areaId]
        );
        if (stores.length === 0) {
          throw new ForbiddenError('Cannot assign a store outside your area');
        }
        if (!stores[0].is_active) {
          throw new ValidationError('Specified store is inactive in the mirror');
        }
      }
    }


    // 2. Policy check
    if (!canCreateUser(actor, { role, areaId, storeId })) {
      throw new ForbiddenError(`You do not have permission to create a user with role ${role}`);
    }

    // 3. Check duplicate email / phone
    const existingEmail = await query(
      `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [normalizedEmail]
    );
    if (existingEmail.length > 0) {
      throw new ConflictError('A user with this email already exists');
    }

    if (phone) {
      const existingPhone = await query(
        `SELECT id FROM users WHERE phone = ? AND deleted_at IS NULL LIMIT 1`,
        [phone]
      );
      if (existingPhone.length > 0) {
        throw new ConflictError('A user with this phone number already exists');
      }
    }

    // 4. Validate password complexity
    if (!validatePasswordStrength(password)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }

    // 5. Hash password and insert user
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, area_id, store_id, created_by_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), normalizedEmail, phone || null, passwordHash, role, areaId, storeId, actor.id, true]
    );

    await logAudit({
      userId: actor.id,
      action: 'USER_CREATE',
      targetType: 'USER',
      targetId: userId,
      details: { name, email: normalizedEmail, role, areaId, storeId },
      ip,
      userAgent,
    });

    return this.getUserById({ actor, userId });
  }

  /**
   * List users with automatic data scoping and filtering
   */
  static async listUsers({ actor, filters }) {
    const { page = 1, limit = 20, search, role, areaId, storeId, isActive } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['u.deleted_at IS NULL'];
    const params = [];

    // Data Scoping (Section 6.5)
    if (actor.role === Roles.OPERATION_MANAGER) {
      // Operation manager can see all, apply optional query filters
      if (areaId) {
        conditions.push('u.area_id = ?');
        params.push(areaId);
      }
      if (storeId) {
        conditions.push('u.store_id = ?');
        params.push(storeId);
      }
      if (role) {
        conditions.push('u.role = ?');
        params.push(role);
      }
    } else if (actor.role === Roles.AREA_MANAGER) {
      // Area Manager sees only users in their area with lower role
      conditions.push('u.area_id = ?');
      params.push(actor.areaId);
      conditions.push(`u.role IN ('${Roles.STORE_MANAGER}', '${Roles.STORE_USER}')`);

      if (storeId) {
        conditions.push('u.store_id = ?');
        params.push(storeId);
      }
      if (role && (role === Roles.STORE_MANAGER || role === Roles.STORE_USER)) {
        conditions.push('u.role = ?');
        params.push(role);
      }
    } else if (actor.role === Roles.STORE_MANAGER) {
      // Store Manager sees only STORE_USER in their store
      conditions.push('u.store_id = ?');
      params.push(actor.storeId);
      conditions.push(`u.role = '${Roles.STORE_USER}'`);
    } else {
      // STORE_USER has no permission to list users
      throw new ForbiddenError('You do not have permission to view users');
    }

    if (isActive !== undefined) {
      conditions.push('u.is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const safeOffset = Math.max(0, (parseInt(page, 10) - 1) * safeLimit);

    // Fetch data with joins for area and store names
    const dataSql = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.area_id as areaId, u.store_id as storeId,
             u.is_active as isActive, u.last_login_at as lastLoginAt, u.created_at as createdAt,
             a.name as areaName, s.name as storeName
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN stores s ON u.store_id = s.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const users = await query(dataSql, params);

    return {
      data: users.map((u) => ({
        ...u,
        isActive: !!u.isActive,
      })),
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single user by ID with scope validation
   */
  static async getUserById({ actor, userId }) {
    const users = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.area_id as areaId, u.store_id as storeId,
              u.is_active as isActive, u.last_login_at as lastLoginAt, u.created_at as createdAt,
              a.name as areaName, s.name as storeName
       FROM users u
       LEFT JOIN areas a ON u.area_id = a.id
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );

    if (users.length === 0) {
      throw new NotFoundError('User not found');
    }

    const targetUser = users[0];

    // If outside actor's scope, return 404 to avoid leaking existence (Section 6.5)
    if (!canManageUser(actor, { ...targetUser, area_id: targetUser.areaId, store_id: targetUser.storeId }) && actor.id !== targetUser.id) {
      throw new NotFoundError('User not found');
    }

    return {
      ...targetUser,
      isActive: !!targetUser.isActive,
    };
  }

  /**
   * Update user details
   */
  static async updateUser({ actor, userId, updates, ip, userAgent }) {
    const current = await this.getUserById({ actor, userId });

    if (!canManageUser(actor, { ...current, area_id: current.areaId, store_id: current.storeId })) {
      throw new ForbiddenError('You do not have permission to manage this user');
    }

    const setClauses = [];
    const params = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      params.push(updates.name.trim());
    }

    if (updates.phone !== undefined) {
      if (updates.phone) {
        const existingPhone = await query(
          `SELECT id FROM users WHERE phone = ? AND id != ? AND deleted_at IS NULL LIMIT 1`,
          [updates.phone, userId]
        );
        if (existingPhone.length > 0) {
          throw new ConflictError('A user with this phone number already exists');
        }
      }
      setClauses.push('phone = ?');
      params.push(updates.phone || null);
    }

    if (updates.password) {
      if (!validatePasswordStrength(updates.password)) {
        throw new ValidationError(
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
        );
      }
      const passwordHash = await hashPassword(updates.password);
      setClauses.push('password_hash = ?', 'token_version = token_version + 1');
      params.push(passwordHash);

      // Invalidate refresh tokens
      await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`, [userId]);
    }

    if (updates.role && updates.role !== current.role) {
      // Check if actor has permission to grant this role
      if (!canCreateUser(actor, { role: updates.role, areaId: current.areaId, storeId: current.storeId })) {
        throw new ForbiddenError(`You cannot assign role ${updates.role}`);
      }
      setClauses.push('role = ?');
      params.push(updates.role);
    }

    if (updates.areaId !== undefined && updates.areaId !== current.areaId) {
      if (updates.areaId) {
        const areas = await query(`SELECT id, is_active FROM areas WHERE id = ? LIMIT 1`, [updates.areaId]);
        if (areas.length === 0) {
          throw new ValidationError('Specified area does not exist');
        }
        if (!areas[0].is_active) {
          throw new ValidationError('Specified area is inactive in the mirror');
        }
        setClauses.push('area_id = ?');
        params.push(updates.areaId);
      } else {
        setClauses.push('area_id = NULL');
      }
    }

    if (updates.storeId !== undefined && updates.storeId !== current.storeId) {
      if (updates.storeId) {
        const stores = await query(
          `SELECT s.id, s.area_id, s.is_active as isStoreActive, a.is_active as isAreaActive 
           FROM stores s 
           JOIN areas a ON s.area_id = a.id 
           WHERE s.id = ? LIMIT 1`,
          [updates.storeId]
        );
        if (stores.length === 0) {
          throw new ValidationError('Specified store does not exist');
        }
        if (!stores[0].isStoreActive) {
          throw new ValidationError('Specified store is inactive in the mirror');
        }
        if (!stores[0].isAreaActive) {
          throw new ValidationError('Specified store belongs to an inactive area');
        }
        if (actor.role === Roles.AREA_MANAGER && stores[0].area_id !== actor.areaId) {
          throw new ForbiddenError('Cannot assign a store outside your area');
        }
        setClauses.push('store_id = ?', 'area_id = ?');
        params.push(updates.storeId, stores[0].area_id);
      } else {
        setClauses.push('store_id = NULL');
      }
    }


    if (setClauses.length === 0) {
      return current;
    }

    params.push(userId);
    await query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, params);

    await logAudit({
      userId: actor.id,
      action: 'USER_UPDATE',
      targetType: 'USER',
      targetId: userId,
      details: updates,
      ip,
      userAgent,
    });

    return this.getUserById({ actor, userId });
  }

  /**
   * Toggle user active status
   */
  static async updateStatus({ actor, userId, isActive, ip, userAgent }) {
    if (actor.id === userId) {
      throw new ForbiddenError('You cannot change the status of your own account');
    }

    const current = await this.getUserById({ actor, userId });

    if (!canManageUser(actor, { ...current, area_id: current.areaId, store_id: current.storeId })) {
      throw new ForbiddenError('You do not have permission to manage this user');
    }

    // If deactivating, increment token_version and revoke all refresh tokens immediately
    if (!isActive) {
      await query(
        `UPDATE users SET is_active = ?, token_version = token_version + 1 WHERE id = ?`,
        [false, userId]
      );
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`,
        [userId]
      );
    } else {
      await query(`UPDATE users SET is_active = ? WHERE id = ?`, [true, userId]);
    }

    await logAudit({
      userId: actor.id,
      action: 'USER_STATUS_CHANGE',
      targetType: 'USER',
      targetId: userId,
      details: { isActive },
      ip,
      userAgent,
    });

    return this.getUserById({ actor, userId });
  }

  /**
   * Soft delete user
   */
  static async deleteUser({ actor, userId, ip, userAgent }) {
    if (actor.id === userId) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    const current = await this.getUserById({ actor, userId });

    if (!canManageUser(actor, { ...current, area_id: current.areaId, store_id: current.storeId })) {
      throw new ForbiddenError('You do not have permission to manage this user');
    }

    // Soft delete & revoke tokens
    await query(
      `UPDATE users SET deleted_at = NOW(), is_active = FALSE, token_version = token_version + 1 WHERE id = ?`,
      [userId]
    );

    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`,
      [userId]
    );

    await logAudit({
      userId: actor.id,
      action: 'USER_DELETE',
      targetType: 'USER',
      targetId: userId,
      ip,
      userAgent,
    });

    return true;
  }
}
