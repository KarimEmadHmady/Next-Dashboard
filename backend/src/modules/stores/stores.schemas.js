import Joi from 'joi';

export const createStoreSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Store name must be at least 2 characters long',
      'any.required': 'Store name is required',
    }),
    areaId: Joi.string().uuid().optional(),
  }),
};

export const updateStoreSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    isActive: Joi.boolean().optional(),
    areaId: Joi.string().uuid().optional(),
  }),
};

export const storeIdParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const listStoresSchema = {
  query: Joi.object({
    areaId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().trim().allow('').optional(),
  }),
};
