class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], data = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
