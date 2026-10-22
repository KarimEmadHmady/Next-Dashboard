import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { Roles } from '../../config/roles.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.util.js';
import { logAudit } from '../../utils/auditLogger.util.js';

export class AreasService {
  static async listAreas(actor) {
    if (actor.role === Roles.OPERATION_MANAGER) {
      const rows = await query(`
        SELECT a.id, a.external_id as externalId, a.name, a.slug, a.lat, a.lng,
               a.is_active as isActive, a.created_at as createdAt, a.updated_at as updatedAt,
               COUNT(s.id) as storeCount
        FROM areas a
        LEFT JOIN stores s ON a.id = s.area_id
        GROUP BY a.id
        ORDER BY a.name ASC
      `);
      return rows.map((r) => ({ ...r, isActive: !!r.isActive }));
    }

    if (actor.role === Roles.AREA_MANAGER) {
      const rows = await query(
        `SELECT a.id, a.external_id as externalId, a.name, a.slug, a.lat, a.lng,
                a.is_active as isActive, a.created_at as createdAt, a.updated_at as updatedAt,
                COUNT(s.id) as storeCount
         FROM areas a
         LEFT JOIN stores s ON a.id = s.area_id
         WHERE a.id = ?
         GROUP BY a.id`,
        [actor.areaId]
      );
      return rows.map((r) => ({ ...r, isActive: !!r.isActive }));
    }

    throw new ForbiddenError('You do not have permission to view areas');
  }

  static async getAreaById(actor, id) {
    if (actor.role === Roles.AREA_MANAGER && actor.areaId !== id) {
      throw new NotFoundError('Area not found');
    }

    const areas = await query(
      `SELECT id, external_id as externalId, name, slug, lat, lng, is_active as isActive,
              created_at as createdAt, updated_at as updatedAt 
       FROM areas WHERE id = ? LIMIT 1`,
      [id]
    );

    if (areas.length === 0) {
      throw new NotFoundError('Area not found');
    }

    return {
      ...areas[0],
      isActive: !!areas[0].isActive,
    };
  }


  static async createArea({ actor, name, ip, userAgent }) {
    const id = uuidv4();
    await query(`INSERT INTO areas (id, name) VALUES (?, ?)`, [id, name.trim()]);

    await logAudit({
      userId: actor.id,
      action: 'AREA_CREATE',
      targetType: 'AREA',
      targetId: id,
      details: { name },
      ip,
      userAgent,
    });

    return { id, name: name.trim() };
  }

  static async updateArea({ actor, id, name, ip, userAgent }) {
    await this.getAreaById(actor, id);

    await query(`UPDATE areas SET name = ? WHERE id = ?`, [name.trim(), id]);

    await logAudit({
      userId: actor.id,
      action: 'AREA_UPDATE',
      targetType: 'AREA',
      targetId: id,
      details: { name },
      ip,
      userAgent,
    });

    return { id, name: name.trim() };
  }

  static async deleteArea({ actor, id, ip, userAgent }) {
    await this.getAreaById(actor, id);

    await query(`DELETE FROM areas WHERE id = ?`, [id]);

    await logAudit({
      userId: actor.id,
      action: 'AREA_DELETE',
      targetType: 'AREA',
      targetId: id,
      ip,
      userAgent,
    });

    return true;
  }

  static async getStoresInArea(actor, areaId) {
    if (actor.role === Roles.AREA_MANAGER && actor.areaId !== areaId) {
      throw new NotFoundError('Area not found');
    }

    const stores = await query(
      `SELECT s.id, s.external_id as externalId, s.name, s.area_id as areaId,
              s.lat, s.lng, s.is_active as isActive,
              s.created_at as createdAt, s.updated_at as updatedAt
       FROM stores s
       WHERE s.area_id = ?
       ORDER BY s.name ASC`,
      [areaId]
    );

    return stores.map((s) => ({
      ...s,
      isActive: !!s.isActive,
    }));
  }
}

