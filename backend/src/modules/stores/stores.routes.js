import { Router } from 'express';
import { StoresController } from './stores.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { Roles } from '../../config/roles.js';
import {
  createStoreSchema,
  updateStoreSchema,
  storeIdParamSchema,
  listStoresSchema,
} from './stores.schemas.js';

const router = Router();

router.use(authenticate);

// List stores: all authenticated users can view their scoped stores
router.get(
  '/',
  validate(listStoresSchema),
  StoresController.list
);

// Get store by ID
router.get(
  '/:id',
  validate(storeIdParamSchema),
  StoresController.getById
);

import { MethodNotAllowedError } from '../../utils/errors.util.js';

const disallowMutation = (req, res, next) => {
  next(
    new MethodNotAllowedError(
      'External system is the source of truth for stores. Local modifications are not allowed.'
    )
  );
};

// Local mutations are disabled (405 METHOD_NOT_ALLOWED)
router.post('/', disallowMutation);
router.patch('/:id', disallowMutation);
router.delete('/:id', disallowMutation);

export default router;

