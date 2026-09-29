/**
 * Operational error carrying an HTTP status code. Anything thrown that is not an
 * AppError is treated as an unexpected 500 by the error handler.
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message) {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }
}

module.exports = AppError;
