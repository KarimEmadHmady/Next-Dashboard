import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { logger } from '../utils/logger.util.js';
import { logAudit } from '../utils/auditLogger.util.js';
import { externalApi } from './externalApi.service.js';
import { ConflictError } from '../utils/errors.util.js';

let isSyncing = false;

export class SyncService {
  /**
   * Run synchronization of areas and stores mirror from the external system.
   * Safe to call on boot or via cron/REST. Never throws unhandled errors when called in background.
   */
  static async syncAreasAndStores({ actor = null, ip = null, userAgent = null } = {}) {
    if (isSyncing) {
      logger.warn('[SyncService] Sync already in progress, skipping overlapping execution.');
      throw new ConflictError('A synchronization job is already running');
    }

    isSyncing = true;
    const startTime = Date.now();
    logger.info('[SyncService] Starting Areas and Stores mirror synchronization...');

    let areasAdded = 0;
    let areasUpdated = 0;
    let areasDeactivated = 0;
    let storesAdded = 0;
    let storesUpdated = 0;
    let storesDeactivated = 0;

    try {
      // 1. Fetch areas from external system
      const externalAreas = await externalApi.getAreas();
      const seenAreaExternalIds = new Set();
      const areaLocalIdMap = new Map(); // externalId (number) -> local UUID

      // Fetch all existing local areas
      const localAreas = await query('SELECT id, external_id, name, slug, lat, lng, is_active FROM areas');
      const localAreasByExtId = new Map();
      for (const a of localAreas) {
        if (a.external_id !== null && a.external_id !== undefined) {
          localAreasByExtId.set(Number(a.external_id), a);
        }
      }

      // Upsert areas
      for (const extArea of externalAreas) {
        seenAreaExternalIds.add(extArea.externalId);
        const existing = localAreasByExtId.get(extArea.externalId);

        if (existing) {
          await query(
            `UPDATE areas 
             SET name = ?, slug = ?, lat = COALESCE(?, lat), lng = COALESCE(?, lng), is_active = 1, synced_at = NOW() 
             WHERE id = ?`,
            [extArea.name, extArea.slug, extArea.lat, extArea.lng, existing.id]
          );
          areaLocalIdMap.set(extArea.externalId, existing.id);
          areasUpdated++;
        } else {
          const newId = uuidv4();
          await query(
            `INSERT INTO areas (id, external_id, name, slug, lat, lng, is_active, synced_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
            [newId, extArea.externalId, extArea.name, extArea.slug, extArea.lat, extArea.lng]
          );
          areaLocalIdMap.set(extArea.externalId, newId);
          areasAdded++;
        }
      }

      // 2. Fetch branches for each external area
      const seenStoreExternalIds = new Set();
      const branchAreaMap = new Map(); // branchExternalId -> { branch, localAreaId }

      for (const extArea of externalAreas) {
        const localAreaId = areaLocalIdMap.get(extArea.externalId);
        if (!localAreaId) continue;

        let branches = [];
        try {
          branches = await externalApi.getBranchesByArea(extArea.externalId);
        } catch (err) {
          logger.error(`[SyncService] Failed to fetch branches for area ${extArea.name} (${extArea.externalId}):`, err.message);
          continue;
        }

        for (const branch of branches) {
          if (branchAreaMap.has(branch.externalId)) {
            logger.warn(
              `[SyncService] Branch ${branch.externalId} (${branch.name}) already associated with another area. Deterministic rule: first area wins.`
            );
            continue;
          }
          branchAreaMap.set(branch.externalId, { branch, localAreaId });
        }
      }

      // Fetch all existing local stores
      const localStores = await query('SELECT id, external_id, name, area_id, lat, lng, is_active FROM stores');
      const localStoresByExtId = new Map();
      for (const s of localStores) {
        if (s.external_id !== null && s.external_id !== undefined) {
          localStoresByExtId.set(Number(s.external_id), s);
        }
      }

      // Upsert stores
      for (const [branchExtId, { branch, localAreaId }] of branchAreaMap.entries()) {
        seenStoreExternalIds.add(branchExtId);
        const existing = localStoresByExtId.get(branchExtId);

        if (existing) {
          await query(
            `UPDATE stores 
             SET name = ?, area_id = ?, lat = COALESCE(?, lat), lng = COALESCE(?, lng), is_active = 1, synced_at = NOW() 
             WHERE id = ?`,
            [branch.name, localAreaId, branch.lat, branch.lng, existing.id]
          );
          storesUpdated++;
        } else {
          const newId = uuidv4();
          await query(
            `INSERT INTO stores (id, external_id, name, area_id, lat, lng, is_active, synced_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
            [newId, branchExtId, branch.name, localAreaId, branch.lat, branch.lng]
          );
          storesAdded++;
        }
      }

      // 3. Soft-deactivate disappeared areas (only externally-managed areas with external_id > 0)
      for (const [extId, localArea] of localAreasByExtId.entries()) {
        if (extId > 0 && !seenAreaExternalIds.has(extId) && localArea.is_active) {
          await query('UPDATE areas SET is_active = 0, synced_at = NOW() WHERE id = ?', [localArea.id]);
          areasDeactivated++;
        }
      }

      // 4. Soft-deactivate disappeared stores (only externally-managed stores with external_id > 0)
      for (const [extId, localStore] of localStoresByExtId.entries()) {
        if (extId > 0 && !seenStoreExternalIds.has(extId) && localStore.is_active) {
          await query('UPDATE stores SET is_active = 0, synced_at = NOW() WHERE id = ?', [localStore.id]);
          storesDeactivated++;
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `[SyncService] Mirror synchronization complete in ${duration}ms: ` +
          `Areas(+${areasAdded}, ~${areasUpdated}, -${areasDeactivated}), ` +
          `Stores(+${storesAdded}, ~${storesUpdated}, -${storesDeactivated})`
      );

      // 5. Audit log entry
      await logAudit({
        userId: actor?.id || null,
        action: 'AREAS_STORES_SYNC',
        targetType: 'SYSTEM',
        details: {
          areasAdded,
          areasUpdated,
          areasDeactivated,
          storesAdded,
          storesUpdated,
          storesDeactivated,
          durationMs: duration,
        },
        ip,
        userAgent,
      });

      return {
        success: true,
        data: {
          areasAdded,
          areasUpdated,
          areasDeactivated,
          storesAdded,
          storesUpdated,
          storesDeactivated,
          syncedAt: new Date().toISOString(),
        },
      };
    } finally {
      isSyncing = false;
    }
  }
}
