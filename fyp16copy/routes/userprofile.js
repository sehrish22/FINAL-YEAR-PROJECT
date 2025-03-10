const express = require("express");
const router = express.Router();
const { AdoptionRequest } = require("../models/adoptionrequest");
const { User } = require("../models/user");
const upload = require("../middlewares/upload"); // Include multer middleware
const validateUser = require("../middlewares/validateUser");
var checkSessionAuth = require("../middlewares/checkSessionAuth");

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
// Render edit profile page
router.get("/editprofile", checkSessionAuth, async (req, res) => {
  try {
    console.log("Edit profile route hit");

    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");
    res.render("userprofile/editprofile", { user });
  } catch (error) {
    console.error("Error loading edit profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Process edit profile form with image upload
router.post("/editprofile", checkSessionAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    // Update fields
    user.name = req.body.name;
    user.email = req.body.email;
    user.contact = req.body.contact;

    // If an image file is provided, update the image path
    if (req.file) {
      user.image = "/uploads/" + req.file.filename;
    }

    await user.save();

    // Optionally, update the session information too:
    req.session.user.name = user.name;
    req.session.user.email = user.email;

    res.redirect("/userprofile"); // or wherever you want to redirect
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

module.exports = router;
