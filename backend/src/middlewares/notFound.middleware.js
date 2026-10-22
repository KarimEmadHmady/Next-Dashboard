import { sendError } from '../utils/response.util.js';

export const notFound = (req, res) => {
  return sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
};