const express = require("express");
const router = express.Router();
const { AdoptionRequest } = require("../models/adoptionrequest");
const { User } = require("../models/user");

// User Profile Dashboard Route
router.get("/", async (req, res) => {
  if (!req.session.user) return res.redirect("/login"); // Ensure user is logged in

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login"); // Handle missing user

    // Fetch adoption requests specific to the logged-in user
    const adoptionrequests = await AdoptionRequest.find({ userId: user._id });

    res.render("userprofile/userprofile", {
      user,
      adoptionrequests,
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
