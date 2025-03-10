const express = require("express");
const router = express.Router();
var { AdoptionRequest } = require("../models/adoptionrequest");
var { Pet } = require("../models/pet");
const { User } = require("../models/user");
const validateAdoptionRequest = require("../middlewares/validateAdoptionRequest");
const upload = require("../middlewares/upload"); // Include multer middleware
const checkSessionAuth = require("../middlewares/checkSessionAuth"); // Make sure this exists

// Adoption Requests Route (Admin & Seller)
router.get("/adoptionrequests", async function (req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  const user = req.session.user;
  try {
    if (user.role === "admin") {
      // Admin: Fetch all adoption requests
      const adoptionrequests = await AdoptionRequest.find().populate("petId").exec();
      res.render("admin/adoptionrequests", { adoptionrequests });
    } else {
      // Seller: Fetch only adoption requests for pets uploaded by this seller
      const sellerPets = await Pet.find({ uploadedBy: user._id }).select("_id").exec();
      const sellerPetIds = sellerPets.map(p => p._id);
      const adoptionrequests = await AdoptionRequest.find({
        petId: { $in: sellerPetIds }
      }).populate("petId").exec();
      res.render("userprofile/adoptionrequests", { adoptionrequests });
    }
  } catch (error) {
    console.error("Error fetching adoption requests:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Store adoption request in the database (authentication enforced)
router.post(
  "/adoptionrequests", // Ensures req.session.user is defined
  upload,
  validateAdoptionRequest,
  async function (req, res, next) {
    // At this point, req.session.user is guaranteed to exist
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
      uploadedBy: pet.uploadedBy,
      adoptionRequestId,
    });
    await adoptionrequest.save();

    res.redirect("/pets");
  }
);

// Show adoption request form with pet details
router.get("/adoptionrequest/:id", async function (req, res, next) {
  try {
    console.log("✅ Pet ID received:", req.params.id);
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      console.error("❌ Pet not found with ID:", req.params.id);
      return res.status(404).send("Pet not found");
    }
    const adoptionRequestId = "AR-" + Date.now(); // Unique ID
    console.log("✅ Pet found:", pet);
    res.render("adoptionrequest", { pet, adoptionRequestId });
  } catch (error) {
    console.error("❌ Error fetching pet:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
