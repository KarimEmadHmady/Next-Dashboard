import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from './auth.schemas.js';
import {
  loginRateLimiter,
  refreshRateLimiter,
} from '../../middlewares/rateLimiter.js';

const router = Router();

// Public routes
router.post('/login', loginRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', refreshRateLimiter, validate(refreshSchema), AuthController.refresh);

// Authenticated routes
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
