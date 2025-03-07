var mongoose = require("mongoose");
const Joi = require('@hapi/Joi')

var petSchema = mongoose.Schema({
  name: String,
  type: String,
  description: String,
  fee: String,
  image: String, // Add image field to store image URL or path
});

const Pet = mongoose.model("Pet", petSchema);

function validatePet(data){
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    fee: Joi.string().min(0).required(),
    type: Joi.string().min(3).max(20).required(),
    description: Joi.string().min(3).required(),
    image: Joi.string().optional()  // Make image optional during validation
  });
  return schema.validate(data,{abortEarly:false});
}

module.exports.Pet = Pet;
module.exports.validate = validatePet;
