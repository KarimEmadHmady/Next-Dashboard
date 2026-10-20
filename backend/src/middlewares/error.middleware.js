// asyncHandler.js + error.middleware.js
// Utility to wrap async routes and centralize error handling

// Wrap async functions to catch errors automatically
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Central error middleware
export const errorMiddleware = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};