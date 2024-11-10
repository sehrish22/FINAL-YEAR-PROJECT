var mongoose = require("mongoose");
const Joi = require('@hapi/Joi');

var UserSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);
module.exports = User;

function validateUser(data){
  const schema = Joi.object({
    name: Joi.string().min(5).max(30).required(),
    email: Joi.string().email().min(10).required(),
    password: Joi.string().min(8).max(30).required(),
  });
  return schema.validate(data,{abortEarly:false});
}
function validateUserLogin(data){
  const schema = Joi.object({
    email: Joi.string().email().min(10).required(),
    password: Joi.string().min(8).max(30).required(),
  });
  return schema.validate(data,{abortEarly:false});
}
module.exports.User = User;
module.exports.validate = validateUser; //for sign up
module.exports.validate = validateUserLogin; //for login