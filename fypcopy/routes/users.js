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

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.redirect("/login");

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid password");

  req.session.user = user;
  res.redirect("/");

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

// POST route to handle forgot password form submission
router.post('/forgot-password', async function(req, res) {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("User with this email does not exist.");

    // Generate a token and set expiration (e.g., 1 hour)
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Set up email transporter and send the reset link
    const transporter = nodemailer.createTransport({ 
        // Define your email service configuration
    });
    
    const mailOptions = {
        to: user.email,
        from: 'your-email@example.com',
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested a password reset for your account.
Please click on the following link, or paste it into your browser, to reset your password:
http://${req.headers.host}/users/reset-password/${token}\n\nIf you did not request this, please ignore this email.`
    };

    transporter.sendMail(mailOptions, function(err) {
        if (err) return res.status(500).send("Email could not be sent.");
        res.send("Password reset email sent. Please check your inbox.");
    });
});


module.exports = router;


