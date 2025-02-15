var express = require("express");
var router = express.Router();
var { User } = require("../models/user");
var bcrypt = require("bcryptjs");
const _ = require ('lodash');
const jwt = require ('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register router
router.get("/register", function (req, res, next) {
  res.render("users/register");
});

router.post("/register", async function (req, res, next) {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User with this email already exists");
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
  if (!user) return res.status(401).send("User does not exist");

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid password");

  req.session.user = user;
  res.redirect("/sellerprofile");

});
//for logout
router.get('/logout', function(req, res, next) {
  req.session.user = null;
  res.redirect('/login');
});
// for reset
router.get('/forgot', function(req, res) {
  res.render('users/forgot');
});
router.post('/reset/:token', async function(req, res) {
  let user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).send("Password reset token is invalid or has expired.");
  
  if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).send("Passwords do not match.");
  }

  // Update user password
  let salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.send("Password has been reset successfully.");
});

// Forgot Password (OTP generation)
router.get("/forgot", (req, res) => {
  res.render("users/forgot");
});

//logout
router.get("/logout",function (req,res){
req.session.user=null;
res.redirect("/login");  
});
module.exports = router;


