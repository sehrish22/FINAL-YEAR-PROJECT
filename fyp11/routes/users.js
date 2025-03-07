var express = require("express");
var router = express.Router();
var { User } = require("../models/user");
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const upload = require("../middlewares/upload");
const validateUser = require("../middlewares/validateUser");

// Register route
router.get("/register", function (req, res) {
  res.render("users/register");
});

router.post("/register", async function (req, res) {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User with this email already exists");

  const { password } = req.body;

  // Password validation
  if (!password || password.length < 8) {
    return res.status(400).send("Password must be at least 8 characters long");
  }

  const digitRegex = /[0-9]/;
  if (!digitRegex.test(password)) {
    return res.status(400).send("Password must contain at least one digit");
  }

  const specialCharRegex = /[!@#$%^&*]/;
  if (!specialCharRegex.test(password)) {
    return res.status(400).send("Password must contain at least one special character");
  }

  user = new User({ ...req.body, role: req.body.role || "seller" });
  let salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  res.redirect("/login");
});

// Login route
router.get("/login", function (req, res) {
  res.render("users/login");
});

router.post("/login", async function (req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.redirect("/login");

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid password");

  req.session.user = user;

  if (user.role === "admin") {
    res.redirect("/admin");
  } else {
    res.redirect("/");
  }
});

// Logout route
router.get("/logout", function (req, res) {
  req.session.user = null;
  res.redirect("/login");
});

// Change Password - GET
router.get("/change-password", function (req, res) {
  if (!req.session.user) return res.redirect("/login");
  res.render("users/change-password");
});

// Change Password - POST
router.post("/change-password", async function (req, res) {
  if (!req.session.user) return res.redirect("/login");

  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate passwords
  if (newPassword !== confirmPassword) {
    return res.status(400).send("New passwords do not match");
  }

  if (newPassword.length < 8) {
    return res.status(400).send("Password must be at least 8 characters long");
  }

  const digitRegex = /[0-9]/;
  if (!digitRegex.test(newPassword)) {
    return res.status(400).send("Password must contain at least one digit");
  }

  const specialCharRegex = /[!@#$%^&*]/;
  if (!specialCharRegex.test(newPassword)) {
    return res.status(400).send("Password must contain at least one special character");
  }

  const user = await User.findById(req.session.user._id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return res.status(400).send("Current password is incorrect");
  }

  let salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.send("Password updated successfully");
});

module.exports = router;
