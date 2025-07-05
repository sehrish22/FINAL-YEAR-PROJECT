var mongoose = require("mongoose");
const Joi = require('@hapi/Joi')

var petSchema = mongoose.Schema({
  name: String,
  type: String,
  breed: String, // Add breed field
  color: String, // Add color field
  gender: String, // Add gender field
  description: String,
  fee: Number, // Change fee to number type
  image: String, // Add image field to store image URL or path
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Linked to User
});

const Pet = mongoose.model("Pet", petSchema);

function validatePet(data){
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    type: Joi.string().min(3).max(20).required(),
    breed: Joi.string().min(3).max(30).required(),
    color: Joi.string().min(3).max(20).required(),
    gender: Joi.string().valid('Male', 'Female').required(), // Add gender validation
    description: Joi.string().min(3).required(),
    fee: Joi.number().min(0).required(), // Change fee validation to number
    image: Joi.string().required()  // Make image optional during validation
  });
  return schema.validate(data,{abortEarly:false});
}

module.exports.Pet = Pet;
module.exports.validate = validatePet;
