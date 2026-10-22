import Joi from 'joi';

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'A valid email address is required',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

export const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().optional(),
  }),
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'New password is required',
      }),
  }),
};
