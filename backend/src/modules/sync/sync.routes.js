import { Router } from 'express';
import { SyncController } from './sync.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { syncRateLimiter } from '../../middlewares/rateLimiter.js';
import { Roles } from '../../config/roles.js';

const router = Router();

// POST /api/v1/sync/areas-stores
// OPERATION_MANAGER only, rate limited to 5/hour
router.post(
  '/areas-stores',
  syncRateLimiter,
  authenticate,
  authorize(Roles.OPERATION_MANAGER),
  SyncController.syncAreasAndStores
);

export default router;
