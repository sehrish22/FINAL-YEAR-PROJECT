var mongoose = require("mongoose");

const petSitterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  experience: { type: Number, required: true },
  pets: { type: [String], required: true },
  addedByAdminAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PetSitter", petSitterSchema);
