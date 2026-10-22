import { StoresService } from './stores.service.js';
import { sendSuccess } from '../../utils/response.util.js';

export class StoresController {
  static async list(req, res, next) {
    try {
      const stores = await StoresService.listStores(req.user, req.query);
      return sendSuccess(res, 200, stores);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const store = await StoresService.getStoreById(req.user, req.params.id);
      return sendSuccess(res, 200, store);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const store = await StoresService.createStore({
        actor: req.user,
        storeData: req.body,
        ip,
        userAgent,
      });

      return sendSuccess(res, 201, store);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const store = await StoresService.updateStore({
        actor: req.user,
        id: req.params.id,
        updates: req.body,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, store);
    } catch (error) {
      next(error);
    }
  }
}
