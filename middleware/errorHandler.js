
const errorHandler = (err, req, res, next) => {
  // Default to 500 if status code not set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error for server-side monitoring
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Determine if we should show stack trace
  const showStack = process.env.NODE_ENV !== 'production';
  
  // Prepare error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(showStack && { stack: err.stack }),
    ...(err.errors && { errors: err.errors }) // For validation errors
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.message = 'Validation failed';
    errorResponse.errors = Object.values(err.errors).map(e => e.message);
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    errorResponse.message = 'Duplicate field value entered';
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token expired';
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;