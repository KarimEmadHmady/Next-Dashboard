import Joi from 'joi';
import { Roles } from '../../config/roles.js';

const roleValues = Object.values(Roles);

export const createUserSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'any.required': 'Name is required',
    }),
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Valid email is required',
      'any.required': 'Email is required',
    }),
    phone: Joi.string().trim().allow(null, '').optional(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required',
      }),
    role: Joi.string()
      .valid(...roleValues)
      .required()
      .messages({
        'any.only': `Role must be one of: ${roleValues.join(', ')}`,
        'any.required': 'Role is required',
      }),
    areaId: Joi.string().uuid().allow(null).optional(),
    storeId: Joi.string().uuid().allow(null).optional(),
  }),
};

export const updateUserSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().trim().allow(null, '').optional(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .optional()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
    role: Joi.string().valid(...roleValues).optional(),
    areaId: Joi.string().uuid().allow(null).optional(),
    storeId: Joi.string().uuid().allow(null).optional(),
  }),
};

export const updateStatusSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    isActive: Joi.boolean().required().messages({
      'any.required': 'isActive boolean value is required',
    }),
  }),
};

export const getUserByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().allow('').optional(),
    role: Joi.string().valid(...roleValues).optional(),
    areaId: Joi.string().uuid().optional(),
    storeId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional(),
  }),
};
