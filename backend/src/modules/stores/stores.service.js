import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { Roles } from '../../config/roles.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.util.js';
import { logAudit } from '../../utils/auditLogger.util.js';

export class StoresService {
  static async listStores(actor, filters = {}) {
    const { areaId, isActive, search } = filters;
    const conditions = [];
    const params = [];

    // Scoping
    if (actor.role === Roles.OPERATION_MANAGER) {
      if (areaId) {
        conditions.push('s.area_id = ?');
        params.push(areaId);
      }
    } else if (actor.role === Roles.AREA_MANAGER) {
      conditions.push('s.area_id = ?');
      params.push(actor.areaId);
    } else if (actor.role === Roles.STORE_MANAGER || actor.role === Roles.STORE_USER) {
      conditions.push('s.id = ?');
      params.push(actor.storeId);
    } else {
      throw new ForbiddenError('You do not have permission to view stores');
    }

    if (isActive !== undefined) {
      conditions.push('s.is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (search) {
      conditions.push('s.name LIKE ?');
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT s.id, s.external_id as externalId, s.name, s.area_id as areaId,
             s.lat, s.lng, s.is_active as isActive,
             s.created_at as createdAt, s.updated_at as updatedAt,
             a.name as areaName, a.external_id as areaExternalId,
             (SELECT COUNT(*) FROM users u WHERE u.store_id = s.id AND u.deleted_at IS NULL) as userCount,
             (SELECT u.name FROM users u WHERE u.store_id = s.id AND u.role = '${Roles.STORE_MANAGER}' AND u.deleted_at IS NULL LIMIT 1) as managerName
      FROM stores s
      JOIN areas a ON s.area_id = a.id
      ${whereClause}
      ORDER BY s.name ASC
    `;

    const stores = await query(sql, params);
    return stores.map((s) => ({
      ...s,
      isActive: !!s.isActive,
    }));
  }

  static async getStoreById(actor, id) {
    const stores = await query(
      `SELECT s.id, s.external_id as externalId, s.name, s.area_id as areaId,
              s.lat, s.lng, s.is_active as isActive,
              s.created_at as createdAt, s.updated_at as updatedAt,
              a.name as areaName, a.external_id as areaExternalId
       FROM stores s
       JOIN areas a ON s.area_id = a.id
       WHERE s.id = ?
       LIMIT 1`,
      [id]
    );


    if (stores.length === 0) {
      throw new NotFoundError('Store not found');
    }

    const store = stores[0];

    // Scoping check (404 if out of scope)
    if (actor.role === Roles.AREA_MANAGER && actor.areaId !== store.areaId) {
      throw new NotFoundError('Store not found');
    }
    if ((actor.role === Roles.STORE_MANAGER || actor.role === Roles.STORE_USER) && actor.storeId !== store.id) {
      throw new NotFoundError('Store not found');
    }

    return {
      ...store,
      isActive: !!store.isActive,
    };
  }

  static async createStore({ actor, storeData, ip, userAgent }) {
    let { name, areaId } = storeData;

    if (actor.role === Roles.AREA_MANAGER) {
      areaId = actor.areaId;
    } else if (actor.role === Roles.OPERATION_MANAGER) {
      if (!areaId) {
        throw new ValidationError('areaId is required');
      }
    } else {
      throw new ForbiddenError('You do not have permission to create stores');
    }

    // Verify area exists
    const areas = await query(`SELECT id FROM areas WHERE id = ? LIMIT 1`, [areaId]);
    if (areas.length === 0) {
      throw new ValidationError('Specified area does not exist');
    }

    const id = uuidv4();
    await query(
      `INSERT INTO stores (id, name, area_id, is_active) VALUES (?, ?, ?, ?)`,
      [id, name.trim(), areaId, true]
    );

    await logAudit({
      userId: actor.id,
      action: 'STORE_CREATE',
      targetType: 'STORE',
      targetId: id,
      details: { name, areaId },
      ip,
      userAgent,
    });

    return this.getStoreById(actor, id);
  }

  static async updateStore({ actor, id, updates, ip, userAgent }) {
    const current = await this.getStoreById(actor, id);

    const setClauses = [];
    const params = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      params.push(updates.name.trim());
    }

    if (updates.isActive !== undefined) {
      if (actor.role === Roles.STORE_MANAGER || actor.role === Roles.STORE_USER) {
        throw new ForbiddenError('You do not have permission to change store status');
      }
      setClauses.push('is_active = ?');
      params.push(updates.isActive ? 1 : 0);
    }

    if (updates.areaId !== undefined && updates.areaId !== current.areaId) {
      if (actor.role !== Roles.OPERATION_MANAGER) {
        throw new ForbiddenError('Only Operation Managers can move stores between areas');
      }
      setClauses.push('area_id = ?');
      params.push(updates.areaId);
    }

    if (setClauses.length === 0) {
      return current;
    }

    params.push(id);
    await query(`UPDATE stores SET ${setClauses.join(', ')} WHERE id = ?`, params);

    await logAudit({
      userId: actor.id,
      action: 'STORE_UPDATE',
      targetType: 'STORE',
      targetId: id,
      details: updates,
      ip,
      userAgent,
    });

    return this.getStoreById(actor, id);
  }
}
