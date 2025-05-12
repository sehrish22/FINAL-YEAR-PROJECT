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
    address: Joi.string().min(3).required(),
    petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
  petName: { type: String, required: true },
  petImage: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adoptionRequestId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Store buyer's ID
  status: { type: String, default: "Pending" },
}, { timestamps: true });
  return schema.validate(data,{abortEarly:false});
}

module.exports.AdoptionRequest = AdoptionRequest;
module.exports.validate = validateAdoptionRequest;
