var express = require("express");
var router = express.Router();
var { Pet } = require("../models/pet");
var checkSessionAuth = require("../middlewares/checkSessionAuth");
const validatePet = require("../middlewares/validatePet");
const upload = require("../middlewares/upload"); // Include multer middleware
const { sendNewsletterEmails } = require("../utils/emailService");

// GET pets list
router.get("/", async function (req, res, next) {
  try {
    let filter = {};
    if (req.query.type) {
      filter.type =
        req.query.type[0].toUpperCase() + req.query.type.substring(1);
    }

    const pets = await Pet.find(filter);

    // Separate user's own pets and others
    const loggedInUserId = req?.session?.user?._id || null;
    let userPets = [];
    let otherPets = [];

    if (loggedInUserId) {
      userPets = pets.filter((pet) => pet.uploadedBy == loggedInUserId);
      otherPets = pets.filter((pet) => pet.uploadedBy != loggedInUserId);
    } else {
      otherPets = pets; // If no user is logged in, show all pets normally
    }

    const sortedPets = [...userPets, ...otherPets]; // User's pets first

    res.render("pets/petslist", {
      title: "Pets",
      pets: sortedPets,
      loggedInUserId,
    });
  } catch (err) {
    console.error("Error fetching pets:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Render add pet page
router.get("/petsadd", checkSessionAuth, async function (req, res, next) {
  res.render("pets/petsadd");
});

// Store data in the database (including image upload)
router.post(
  "/petsadd",
  checkSessionAuth,
  upload,
  validatePet,
  async function (req, res, next) {
    let petData = req.body;
    if (req.file) {
      petData.image = "/uploads/" + req.file.filename; // Store image URL in the image field
    }
    petData.uploadedBy = req.session.user._id;
    let pet = new Pet(petData);
    await pet.save();

    // Prepare email content
    const subject = `New Pet Available for Adoption: ${pet.name}`;
    const message = `
      <h2>Exciting News!</h2>
      <p>A new pet has been listed on FurEverHome.</p>
      <p><strong>Name:</strong> ${pet.name}</p>
      <p><strong>Type:</strong> ${pet.type}</p>
      <p><strong>Breed:</strong> ${pet.breed}</p>
      <p><strong>Description:</strong> ${pet.description}</p>
    `;

    // Send emails to all subscribers
    await sendNewsletterEmails(pet);

    res.redirect("/pets");
  }
);
//get details of a pet
router.get("/:id", async (req, res) => {
  const petId = req.params.id;

  // Ensure the petId is a valid ObjectId before querying
  if (!petId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send("Invalid Pet ID");
  }

  const pet = await Pet.findById(petId);
  if (!pet) {
    return res.status(404).send("Pet not found");
  }

  res.render("pets/petsdetails", { title: pet.name, pet });
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
router.post(
  "/petsedit/:id",
  checkSessionAuth,
  upload,
  validatePet,
  async function (req, res, next) {
    let pet = await Pet.findById(req.params.id);

    pet.name = req.body.name;
    pet.type = req.body.type;
    pet.breed = req.body.breed;
    pet.color = req.body.color;
    pet.fee = req.body.fee;
    pet.description = req.body.description;

    if (req.file) {
      pet.image = "/uploads/" + req.file.filename; // Update the image URL if a new file is uploaded
    }

    await pet.save();
    res.redirect("/pets");
  }
);
//adoption request page
router.get("/adoptionrequest/:id", async function (req, res, next) {
  const pet = await Pet.findById(req.params.id);
  if (!pet) {
    return res.status(404).send("Pet not found");
  }

  const adoptionRequestId = "AR-" + Date.now(); // Generate unique request ID
  res.render("adoptionrequest", { pet, adoptionRequestId });
});
module.exports = router;
