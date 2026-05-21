const ApiError = require('../utils/ApiError');
const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`);
      return next(new ApiError(400, 'Validation failed', errorMessages));
    }
    next();
  };
};

module.exports = validate;