const { validate } = require("../models/order");

function validateOrder(req, res, next) {
  const { error } = validate(req.body);
  req.validationError = error || null;
  next();
}

module.exports = validateOrder;
