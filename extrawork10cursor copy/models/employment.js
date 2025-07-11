var mongoose = require("mongoose");

var EmploymentSchema = mongoose.Schema({
  name: String,
  email: String,
  number : String,
});
const Employment = mongoose.model("Employment", EmploymentSchema);
module.exports = Employment;