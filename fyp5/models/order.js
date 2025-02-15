var mongoose = require("mongoose");
const Joi = require("@hapi/Joi");
const { Product } = require("./product");

var orderSchema = mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  address: String,
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to the Product model
    },
  ],
});

const Order = mongoose.model("Order", orderSchema);

function validateOrder(data) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(0).required(),
    cotact: Joi.string().min(3).max(20).required(),
    address: Joi.string().min(3).required(),
  });
  return schema.validate(data, { abortEarly: false });
}

module.exports.Order = Order;
module.exports.validate = validateOrder;
