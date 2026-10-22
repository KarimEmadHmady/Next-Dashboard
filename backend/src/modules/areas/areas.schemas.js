import Joi from 'joi';

export const createAreaSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Area name must be at least 2 characters long',
      'any.required': 'Area name is required',
    }),
  }),
};

export const updateAreaSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
  }),
};

export const areaIdParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};
