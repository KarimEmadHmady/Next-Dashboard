export const sendSuccess = (res, statusCode = 200, data = {}, meta = undefined) => {
  const response = {
    success: true,
    data,
  };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', details = null) => {
  const errorObj = {
    code,
    message,
  };
  if (details && details.length > 0) {
    errorObj.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};
