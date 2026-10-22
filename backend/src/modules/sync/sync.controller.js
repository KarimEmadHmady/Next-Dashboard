import { SyncService } from '../../services/sync.service.js';
import { sendSuccess } from '../../utils/response.util.js';

export class SyncController {
  static async syncAreasAndStores(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await SyncService.syncAreasAndStores({
        actor: req.user,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, result.data);
    } catch (error) {
      next(error);
    }
  }
}
