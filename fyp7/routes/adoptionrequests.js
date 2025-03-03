const express = require("express");
const router = express.Router();
var { AdoptionRequest } = require("../models/adoptionrequest");
var { Pet } = require("../models/pet");
const validateAdoptionRequest = require("../middlewares/validateAdoptionRequest");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Adoptionrequests Route
router.get("/adoptionrequests", async function (req, res, next) {
  let adoptionrequests = await AdoptionRequest.find();
  res.render("admin/adoptionrequests", { adoptionrequests });
});
// Store data in the database (including image upload)
// Store adoption request in the database
router.post("/", upload, validateAdoptionRequest, async function (req, res, next) {
  const { name, email, address, contact, petId, adoptionRequestId } = req.body;

  // Fetch the pet to save its image and name
  const pet = await Pet.findById(petId);
  if (!pet) return res.status(404).send("Pet not found");

  let adoptionrequest = new AdoptionRequest({
    name,
    email,
    address,
    contact,
    petId,
    petName: pet.name,
    petImage: pet.image,
    adoptionRequestId,
  });
  await adoptionrequest.save();

  res.redirect("/pets");
});
// Show adoption request form with pet details
router.get("/:id", async function (req, res, next) {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).send("Pet not found");

  // Generate a unique adoption request ID
  const adoptionRequestId = "AR-" + Date.now();

  res.render("adoptionrequest", { pet, adoptionRequestId });
});
// Export the router
module.exports = router;
