var mongoose = require("mongoose");
const Joi = require("@hapi/Joi");

var UserSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  image: String, // Add image field to store image URL or path
  role: {
    type: String,
    enum: ["admin", "seller"],
    default: "seller", // Default to seller role
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;

function validateUser(data) {
  console.log("lets see", data);
  const schema = Joi.object({
    name: Joi.string().min(5).max(30).required(),
    email: Joi.string().email().min(10).required(),
    password: Joi.string().min(8).max(30).required(),
    image: Joi.string().optional(), // Make image optional during validation
    role: Joi.string().valid("admin", "seller").optional(),
  });
  return schema.validate(data, { abortEarly: false });
}

function validateUserLogin(data) {
  const schema = Joi.object({
    email: Joi.string().email().min(10).required(),
    password: Joi.string().min(8).max(30).required(),
  });
  return schema.validate(data, { abortEarly: false });
}

module.exports.User = User;
module.exports.validate = validateUser; //for sign up
module.exports.validateLogin = validateUserLogin; //for login
