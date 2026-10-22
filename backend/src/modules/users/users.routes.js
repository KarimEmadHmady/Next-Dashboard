import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUserRateLimiter } from '../../middlewares/rateLimiter.js';
import { Roles } from '../../config/roles.js';
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  getUserByIdSchema,
  listUsersSchema,
} from './users.schemas.js';

const router = Router();

// All user management routes require authentication and manager role
const managerRoles = [Roles.OPERATION_MANAGER, Roles.AREA_MANAGER, Roles.STORE_MANAGER];

router.use(authenticate);

router.post(
  '/',
  createUserRateLimiter,
  authorize(...managerRoles),
  validate(createUserSchema),
  UsersController.create
);

router.get(
  '/',
  authorize(...managerRoles),
  validate(listUsersSchema),
  UsersController.list
);

router.get(
  '/:id',
  authorize(...managerRoles),
  validate(getUserByIdSchema),
  UsersController.getById
);

router.patch(
  '/:id',
  authorize(...managerRoles),
  validate(updateUserSchema),
  UsersController.update
);

router.patch(
  '/:id/status',
  authorize(...managerRoles),
  validate(updateStatusSchema),
  UsersController.updateStatus
);

router.delete(
  '/:id',
  authorize(...managerRoles),
  validate(getUserByIdSchema),
  UsersController.delete
);

export default router;
