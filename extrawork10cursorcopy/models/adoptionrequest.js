var mongoose = require("mongoose");
const Joi = require('@hapi/Joi')

var adoptionrequestSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  contact: String,
  petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },
  petName: String,
  petImage: String,
  adoptionRequestId: String,
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const AdoptionRequest = mongoose.model("AdoptionRequest", adoptionrequestSchema);

function validateAdoptionRequest(data){
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(0).required(),
    contact: Joi.string().min(3).max(20).required(),
    petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    petName: { type: String, required: true },
    petImage: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adoptionRequestId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: Joi.string().valid('Pending', 'Approved', 'Rejected')
  }, { timestamps: true });
  return schema.validate(data,{abortEarly:false});
}

module.exports.AdoptionRequest = AdoptionRequest;
module.exports.validate = validateAdoptionRequest;
