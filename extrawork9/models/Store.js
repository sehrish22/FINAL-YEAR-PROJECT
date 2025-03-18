// models/Store.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },
  openingTime: { type: String, required: true },
  closingTime: { type: String, required: true },
});

module.exports = mongoose.model("Store", storeSchema);
