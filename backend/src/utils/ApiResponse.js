class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = undefined) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;

    if (meta !== undefined) {
      this.meta = meta;
    }
  }
}

module.exports = ApiResponse;
