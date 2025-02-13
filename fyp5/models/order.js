var mongoose = require("mongoose");
const Joi = require('@hapi/Joi')

var orderSchema = mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  address: String,
});

const Order = mongoose.model("Order", orderSchema);

function validateOrder(data){
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(0).required(),
    cotact: Joi.string().min(3).max(20).required(),
    address: Joi.string().min(3).required(),
  });
  return schema.validate(data,{abortEarly:false});
}

module.exports.Order = Order;
module.exports.validate = validateOrder;
