import { AppError } from '../utils/errors.util.js';
import { sendError } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorMiddleware = (err, req, res, next) => {
  // If response already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err.stack);

  // 1. AppError (operational error)
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // 2. MySQL Duplicate Entry (e.g. email, phone unique violation)
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 409, 'CONFLICT', 'A record with this unique identifier already exists');
  }

  // 3. MySQL Foreign Key Constraint Fail
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Referenced entity does not exist');
  }

  // 4. JWT errors
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Token has expired');
  }
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid token');
  }

  // 5. JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Malformed JSON in request body');
  }

  // 6. Generic unhandled error (500)
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev ? err.message : 'Internal server error';
  return sendError(res, 500, 'INTERNAL_ERROR', message);
};