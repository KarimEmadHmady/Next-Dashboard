export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Unauthenticated', code = 'UNAUTHENTICATED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Account is temporarily locked. Please try again later.', code = 'ACCOUNT_LOCKED') {
    super(message, 423, code);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please slow down.', code = 'RATE_LIMITED') {
    super(message, 429, code);
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(message = 'Method not allowed', code = 'METHOD_NOT_ALLOWED') {
    super(message, 405, code);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service error', code = 'EXTERNAL_SERVICE_ERROR', details = null) {
    super(message, 502, code, details);
  }
}

export class ExternalServiceTimeoutError extends AppError {
  constructor(message = 'External service timeout', code = 'EXTERNAL_SERVICE_TIMEOUT', details = null) {
    super(message, 504, code, details);
  }
}

