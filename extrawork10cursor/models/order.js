var mongoose = require("mongoose");
const Joi = require("@hapi/Joi");

var orderSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true }, // Store product name for display
      image: { type: String }, // Store product image
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      subtotal: { type: Number, required: true }, // quantity * price
    },
  ],
  total: { type: Number, required: true },
  orderId: { type: String, required: true },
  orderStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

function validateOrder(data) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().required(),
    contact: Joi.string().min(11).max(12).required(),
    address: Joi.string().min(15).max(30).required(),
  });
  return schema.validate(data, { abortEarly: false, allowUnknown: true });
}

module.exports.Order = Order;
module.exports.validate = validateOrder;
