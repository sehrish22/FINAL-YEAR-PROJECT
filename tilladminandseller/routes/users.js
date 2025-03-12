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

// Register router
router.get("/register", function (req, res, next) {
  res.render("users/register");
});

router.post("/register", async function (req, res, next) {
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.render("users/register", { error: "User with this email already exists" });
  }

  const { password } = req.body;
  // Validate password length
  if (!password || password.length < 8){
    return res.render("users/register", { error: "Passowrd must be 8 characters long" });
  }

  // Check for at least one digit
  const digitRegex = /[0-9]/;
  if (!digitRegex.test(password)) {
    return res.render("users/register", { error: "Password must contain atleast 1 digit" });
  }

  // Check for at least one special character
  const specialCharRegex = /[!@#$%^&*]/;
  if (!specialCharRegex.test(password)) {
    return res.render("users/register", { error: "Password must contain atleast 1 special character" });
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
//login post
router.post("/login", async function (req, res) {
  const {email,password}=req.body;
  const user = await User.findOne({ email: req.body.email });
  if (!user){
    return res.render("users/login", { error: "Invalid email or password" });
  }

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) {
    return res.render("users/login", { error: "Incorrect password" });
  }

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
//for logout
router.get("/logout", function (req, res, next) {
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
