var express = require("express");
var router = express.Router();
var { User } = require("../models/user");
var bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

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
