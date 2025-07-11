const mongoose = require("mongoose");

// Check if the model already exists
const Vet = mongoose.models.Vet || mongoose.model("Vet", new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },
  openingTime: { type: String, required: true },
  closingTime: { type: String, required: true },
  description: { type: String },
  image: { type: String } // Store the path to the image
}));

module.exports = Vet;