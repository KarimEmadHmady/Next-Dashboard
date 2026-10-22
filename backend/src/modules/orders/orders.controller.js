import { OrdersService } from './orders.service.js';
import { sendSuccess } from '../../utils/response.util.js';

export class OrdersController {
  static async list(req, res, next) {
    try {
      const result = await OrdersService.listOrders({
        actor: req.user,
        filters: req.query,
      });

      return sendSuccess(res, 200, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await OrdersService.getOrderById({
        actor: req.user,
        id,
      });

      return sendSuccess(res, 200, order);
    } catch (error) {
      next(error);
    }
  }

  static async getTimeline(req, res, next) {
    try {
      const { id } = req.params;
      const timeline = await OrdersService.getOrderTimeline({
        actor: req.user,
        id,
      });

      return sendSuccess(res, 200, timeline);
    } catch (error) {
      next(error);
    }
  }

  static async getStatuses(req, res, next) {
    try {
      const statuses = await OrdersService.getOrderStatuses();
      return sendSuccess(res, 200, statuses);
    } catch (error) {
      next(error);
    }
  }
}
