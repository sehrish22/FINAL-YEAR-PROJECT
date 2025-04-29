var mongoose = require("mongoose");

const sitterApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  experience: { type: Number, required: true },
  pets: { type: [String], required: true },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SitterApplication", sitterApplicationSchema);
