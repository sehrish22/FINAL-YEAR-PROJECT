var mongoose = require("mongoose");
const Joi = require('@hapi/Joi')

var productSchema = mongoose.Schema({
  name: String,
  type: String,
  description: String,
  price: String,
  image: String, // Add image field to store image URL or path
});

const Product = mongoose.model("Product", productSchema);

function validateProduct(data){
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    price: Joi.string().min(0).required(),
    type: Joi.string().min(3).max(20).required(),
    description: Joi.string().min(3).required(),
    image: Joi.string().optional()  // Make image optional during validation
  });
  return schema.validate(data,{abortEarly:false});
}

module.exports.Product = Product;
module.exports.validate = validateProduct;
