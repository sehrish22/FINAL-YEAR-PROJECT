const { validate } = require("../models/adoptionrequest");
function validateAdoptionRequest(req, res, next) {
  //sets variable for every pug file
  const { error } = validate(req.body);
  //if(error) return res.status(400).send(error.details[0].message);
  next();
}
module.exports = validateAdoptionRequest;
