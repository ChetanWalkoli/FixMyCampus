import env from "../config/env.js";

/**
 * 404 Not Found handler for unmatched routes.
 */
export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global Express error-handling middleware.
 */
export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  if (env.nodeEnv !== "production") {
    console.error(`[Error ${statusCode}]:`, message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.nodeEnv === "development" && err.stack ? { stack: err.stack } : {}),
  });
};
