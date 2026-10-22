import { Router } from 'express';
import { AreasController } from './areas.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { Roles } from '../../config/roles.js';
import {
  createAreaSchema,
  updateAreaSchema,
  areaIdParamSchema,
} from './areas.schemas.js';

const router = Router();

router.use(authenticate);

// List areas
router.get(
  '/',
  authorize(Roles.OPERATION_MANAGER, Roles.AREA_MANAGER),
  AreasController.list
);

// Get single area
router.get(
  '/:id',
  authorize(Roles.OPERATION_MANAGER, Roles.AREA_MANAGER),
  validate(areaIdParamSchema),
  AreasController.getById
);

// Get stores in area
router.get(
  '/:id/stores',
  authorize(Roles.OPERATION_MANAGER, Roles.AREA_MANAGER),
  validate(areaIdParamSchema),
  AreasController.getStores
);

import { MethodNotAllowedError } from '../../utils/errors.util.js';

const disallowMutation = (req, res, next) => {
  next(
    new MethodNotAllowedError(
      'External system is the source of truth for areas. Local modifications are not allowed.'
    )
  );
};

// Local mutations are disabled (405 METHOD_NOT_ALLOWED)
router.post('/', disallowMutation);
router.patch('/:id', disallowMutation);
router.delete('/:id', disallowMutation);

export default router;

