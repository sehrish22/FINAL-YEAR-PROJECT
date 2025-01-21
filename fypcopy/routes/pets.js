var express = require("express");
var router = express.Router();
var { Pet } = require("../models/pet");
var checkSessionAuth = require("../middlewares/checkSessionAuth");
const validatePet = require("../middlewares/validatePet");
const upload = require("../middlewares/upload"); // Include multer middleware

// GET pets list
router.get("/", async function (req, res, next) {
  let pets = await Pet.find();
  res.render("pets/petslist", { title: "pets", pets });
});
// Render add pet page
router.get("/petsadd", checkSessionAuth, async function (req, res, next) {
  res.render("pets/petsadd");
});

// Store data in the database (including image upload)
router.post("/petsadd", checkSessionAuth, upload, validatePet, async function (req, res, next) {
  let petData = req.body;
  if (req.file) {
    petData.image = '/uploads/' + req.file.filename; // Store image URL in the image field
  }
  let pet = new Pet(petData);
  await pet.save();
  res.redirect("/pets");
});

// Delete a pet
router.get("/delete/:id", async function (req, res, next) {
  await Pet.findByIdAndDelete(req.params.id);
  res.redirect("/pets");
});

// Render edit pet page
router.get("/edit/:id", async function (req, res, next) {
  let pet = await Pet.findById(req.params.id);
  res.render("pets/petsedit", { pet });
});

// Save edited pet details (including image upload)
router.post("/petsedit/:id", checkSessionAuth, upload, validatePet, async function (req, res, next) {
  let pet = await Pet.findById(req.params.id);

  pet.name = req.body.name;
  pet.type = req.body.type;
  pet.fee = req.body.fee;
  pet.description = req.body.description;

  if (req.file) {
    pet.image = '/uploads/' + req.file.filename; // Update the image URL if a new file is uploaded
  }

  await pet.save();
  res.redirect("/pets");
});
//checkout page
router.get("/adoptionrequest",async function(req,res,next){
  res.render("adoptionrequest");
})
module.exports = router;
