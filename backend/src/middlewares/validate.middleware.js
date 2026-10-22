import { ValidationError } from '../utils/errors.util.js';

/**
 * Middleware factory for validating request data against Joi schemas.
 * @param {Object} schemas - { body?: JoiSchema, query?: JoiSchema, params?: JoiSchema }
 */
export const validate = (schemas = {}) => {
  return (req, res, next) => {
    const targets = ['params', 'query', 'body'];
    const details = [];

    for (const target of targets) {
      if (schemas[target]) {
        const { error, value } = schemas[target].validate(req[target], {
          abortEarly: false,
          stripUnknown: false, // Whitelist strictly - extra unknown fields trigger validation error
          convert: true,
        });

        if (error) {
          error.details.forEach((item) => {
            details.push({
              field: item.path.join('.'),
              message: item.message.replace(/['"]/g, ''),
            });
          });
        } else {
          try {
            req[target] = value;
          } catch {
            Object.defineProperty(req, target, {
              value,
              writable: true,
              configurable: true,
              enumerable: true,
            });
          }
        }
      }
    }

    if (details.length > 0) {
      return next(new ValidationError('Invalid input data', details));
    }

    next();
  };
};