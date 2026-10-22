import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { listOrdersSchema, orderIdParamSchema } from './orders.schemas.js';
import { Roles } from '../../config/roles.js';

const router = Router();

// Full middleware chain: rateLimit (global) -> authenticate -> authorize -> validate -> controller
router.use(authenticate);

const allRoles = [
  Roles.OPERATION_MANAGER,
  Roles.AREA_MANAGER,
  Roles.STORE_MANAGER,
  Roles.STORE_USER,
];

// GET /api/v1/orders
router.get('/', authorize(...allRoles), validate(listOrdersSchema), OrdersController.list);

// GET /api/v1/orders/statuses
router.get('/statuses', authorize(...allRoles), OrdersController.getStatuses);

// GET /api/v1/orders/:id
router.get('/:id', authorize(...allRoles), validate(orderIdParamSchema), OrdersController.getById);

// GET /api/v1/orders/:id/timeline
router.get('/:id/timeline', authorize(...allRoles), validate(orderIdParamSchema), OrdersController.getTimeline);

export default router;
