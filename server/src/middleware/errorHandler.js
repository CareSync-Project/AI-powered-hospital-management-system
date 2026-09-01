export class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const PRISMA_ERROR_STATUS = {
  P2002: 409,
  P2003: 409,
  P2025: 404,
};

const PRISMA_ERROR_MESSAGE = {
  P2002: 'A record with these unique values already exists',
  P2003: 'The operation conflicts with a related record',
  P2025: 'The requested record was not found',
};

export function notFoundHandler(request, _response, next) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
}

export function errorHandler(error, _request, response, _next) {
  const prismaStatus = PRISMA_ERROR_STATUS[error.code];
  const statusCode = error.statusCode || prismaStatus || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : (PRISMA_ERROR_MESSAGE[error.code] || error.message),
    ...(error.details ? { errors: error.details } : {}),
  });
}
