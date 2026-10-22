import { AreasService } from './areas.service.js';
import { sendSuccess } from '../../utils/response.util.js';

export class AreasController {
  static async list(req, res, next) {
    try {
      const areas = await AreasService.listAreas(req.user);
      return sendSuccess(res, 200, areas);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const area = await AreasService.getAreaById(req.user, req.params.id);
      return sendSuccess(res, 200, area);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const area = await AreasService.createArea({
        actor: req.user,
        name: req.body.name,
        ip,
        userAgent,
      });

      return sendSuccess(res, 201, area);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const area = await AreasService.updateArea({
        actor: req.user,
        id: req.params.id,
        name: req.body.name,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, area);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      await AreasService.deleteArea({
        actor: req.user,
        id: req.params.id,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, { message: 'Area deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getStores(req, res, next) {
    try {
      const stores = await AreasService.getStoresInArea(req.user, req.params.id);
      return sendSuccess(res, 200, stores);
    } catch (error) {
      next(error);
    }
  }
}
