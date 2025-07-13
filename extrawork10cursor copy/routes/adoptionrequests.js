const express = require("express");
const router = express.Router();
var { AdoptionRequest } = require("../models/adoptionrequest");
var { Pet } = require("../models/pet");
const { User } = require("../models/user");
const validateAdoptionRequest = require("../middlewares/validateAdoptionRequest");
const upload = require("../middlewares/upload"); // Include multer middleware
const checkSessionAuth = require("../middlewares/checkSessionAuth"); // Make sure this exists

// Adoption Requests Route (Seller)
router.get("/", async function (req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  const user = req.session.user;
  try {
      if (user.role === "seller") {
      // Seller: Fetch only adoption requests for pets uploaded by this seller
      const adoptionrequests = await AdoptionRequest.find({
        "petId.uploadedBy": user._id
      })
      .populate({
        path: "petId",
        match: { uploadedBy: user._id }
      })
      .populate("userId")
      .exec();
      
      // Filter out null petId entries (in case some pets were deleted)
      const filteredRequests = adoptionrequests.filter(req => req.petId !== null);
      res.render("userprofile/adoptionrequests", { adoptionrequests: filteredRequests });
    }
  } catch (error) {
    console.error("Error fetching adoption requests:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Store adoption request in the database (authentication enforced)
router.post(
  "/",
  validateAdoptionRequest,checkSessionAuth,
  async function (req, res, next) {
    console.log("🧾 Received body:", req.body);
    // At this point, req.session.user is guaranteed to exist
    const sessionId = req.session.sessionId;
    const userId = req.session.user._id;
    const { name, email, address, contact, petId, adoptionRequestId } = req.body;

    // Fetch the pet to save its image and name
    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).send("Pet not found");
    if (!req.session.user || req.session.user.role !== "buyer") {
        req.flash("error", "⚠️ Only buyers can Adopt Pet. Please log in as a buyer.");
        // Render the adoption request form page with error
        return res.render("adoptionrequest", {
            pet,
            user: req.session.user,
            error: req.flash("error"),
            // Add any other variables your template expects
        });
      }
    let adoptionrequest = new AdoptionRequest({
      name,
      email,
      contact,
      petId,
      petName: pet.name,
      petImage: pet.image,
      uploadedBy: pet.uploadedBy,
      adoptionRequestId,
      userId,
    });
    await adoptionrequest.save();
    console.log(adoptionrequest);
    res.redirect("/buyerprofile");
  }
);
module.exports = router;
