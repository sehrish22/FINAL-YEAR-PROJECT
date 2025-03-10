var express = require("express");
var router = express.Router();
var { User } = require("../models/user");
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const upload = require("../middlewares/upload"); // Include multer middleware
const validateUser = require("../middlewares/validateUser");
var checkSessionAuth = require("../middlewares/checkSessionAuth");

// Register router
router.get("/register", function (req, res, next) {
  res.render("users/register");
});

router.post("/register", async function (req, res, next) {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User with this email already exists");
  const { password } = req.body;
  // Validate password length
  if (!password || password.length < 8) {
    return res.status(400).send("Password must be at least 8 characters long");
  }

  // Check for at least one digit
  const digitRegex = /[0-9]/;
  if (!digitRegex.test(password)) {
    return res.status(400).send("Password must contain at least one digit");
  }

  // Check for at least one special character
  const specialCharRegex = /[!@#$%^&*]/;
  if (!specialCharRegex.test(password)) {
    return res
      .status(400)
      .send("Password must contain at least one special character");
  }

  user = new User(req.body);
  let salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  res.redirect("/login");
});

// Login route
router.get("/login", function (req, res, next) {
  res.render("users/login");
});

router.post("/login", async function (req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.redirect("/login");

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid password");

  req.session.user = {
    _id: user._id,
    email: user.email,
    role: user.role,
  };
  if (user.role === "admin") {
    res.redirect("/admin");
  } else {
    res.redirect("/userprofile");
  }
});

// For logout
router.get("/logout", function (req, res, next) {
  req.session.user = null;
  res.redirect("/login");
});

// Render edit profile page
router.get("/edit", checkSessionAuth, async (req, res) => {
  try {
    console.log("Edit profile route hit");

    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");
    res.render("users/editprofile", { user });
  } catch (error) {
    console.error("Error loading edit profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Process edit profile form with image upload
router.post("/edit", checkSessionAuth, async (req, res) => {
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
