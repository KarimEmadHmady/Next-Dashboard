import { UsersService } from './users.service.js';
import { sendSuccess } from '../../utils/response.util.js';

export class UsersController {
  static async create(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const user = await UsersService.createUser({
        actor: req.user,
        userData: req.body,
        ip,
        userAgent,
      });

      return sendSuccess(res, 201, user);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await UsersService.listUsers({
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
      const user = await UsersService.getUserById({
        actor: req.user,
        userId: req.params.id,
      });

      return sendSuccess(res, 200, user);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const user = await UsersService.updateUser({
        actor: req.user,
        userId: req.params.id,
        updates: req.body,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, user);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const user = await UsersService.updateStatus({
        actor: req.user,
        userId: req.params.id,
        isActive: req.body.isActive,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, user);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      await UsersService.deleteUser({
        actor: req.user,
        userId: req.params.id,
        ip,
        userAgent,
      });

      return sendSuccess(res, 200, {
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
