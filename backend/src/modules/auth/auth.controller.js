import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.util.js';
import { setAuthCookies, clearAuthCookies } from '../../utils/token.util.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login({
        email,
        password,
        ip,
        userAgent,
      });

      setAuthCookies(res, result.accessToken, result.refreshToken);

      return sendSuccess(res, 200, {
        user: result.user,
        accessToken: result.accessToken,
        allowedPages: result.allowedPages,
        permissions: result.permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const rawRefreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.refresh({
        rawRefreshToken,
        ip,
        userAgent,
      });

      setAuthCookies(res, result.accessToken, result.refreshToken);

      return sendSuccess(res, 200, {
        accessToken: result.accessToken,
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const rawRefreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      await AuthService.logout({
        rawRefreshToken,
        userId: req.user.id,
        ip,
        userAgent,
      });

      clearAuthCookies(res);

      return sendSuccess(res, 200, {
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      await AuthService.logoutAll({
        userId: req.user.id,
        ip,
        userAgent,
      });

      clearAuthCookies(res);

      return sendSuccess(res, 200, {
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const result = await AuthService.getMe(req.user.id);
      return sendSuccess(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'];

      await AuthService.changePassword({
        userId: req.user.id,
        currentPassword,
        newPassword,
        ip,
        userAgent,
      });

      clearAuthCookies(res);

      return sendSuccess(res, 200, {
        message: 'Password changed successfully. Please log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
}
