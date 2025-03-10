var mongoose = require("mongoose");
const Joi = require('@hapi/Joi')

var adoptionrequestSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  contact: String,
  address: String,
  petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },
  petName: String,
  petImage: String,
  adoptionRequestId: String,
});

const AdoptionRequest = mongoose.model("AdoptionRequest", adoptionrequestSchema);

function validateAdoptionRequest(data){
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(0).required(),
    cotact: Joi.string().min(3).max(20).required(),
    address: Joi.string().min(3).required(),
  });
  return schema.validate(data,{abortEarly:false});
}

module.exports.AdoptionRequest = AdoptionRequest;
module.exports.validate = validateAdoptionRequest;
