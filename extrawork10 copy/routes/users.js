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

router.post("/register", async function (req, res) {
  let errors = {};
  const { name, email, password, contact, role } = req.body;

  // Check if email already exists
  let user = await User.findOne({ email });
  if (user) {
    errors.email = "User with this email already exists";
  }

  // Validate password length
  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  }

  // Check for at least one digit
  if (!/[0-9]/.test(password)) {
    errors.password = "Password must contain at least 1 digit";
  }

  // Check for at least one special character
  if (!/[!@#$%^&*]/.test(password)) {
    errors.password = "Password must contain at least 1 special character";
  }

  // If any errors exist, re-render the form with input values and errors
  if (Object.keys(errors).length > 0) {
    return res.render("users/register", { errors, req });
  }

  try {
    user = new User(req.body);
    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    user.otp = otp;
    user.otpExpires = Date.now() + 1 * 60 * 1000; // OTP expires in 10 minutes

    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: "no-reply@fureverhome.com",
      to: user.email,
      subject: "Your OTP for FurEverHome Account Verification",
      text: `Your OTP for account verification is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.redirect(`/verify-otp?email=${user.email}`); // Redirect to OTP verification page
  } catch (err) {
    console.error(err);
    res.render("users/register", {
      errors: { general: "An error occurred" },
      req,
    });
  }
});

router.get("/verify-otp", function (req, res) {
  res.render("users/verify-otp", { email: req.query.email });
});

router.post("/verify-otp", async function (req, res) {
  const { email, otp } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    return res.render("users/verify-otp", { error: "Invalid email", email });
  }

  if (user.otp !== otp || Date.now() > user.otpExpires) {
    return res.render("users/verify-otp", {
      error: "Invalid or expired OTP",
      email,
    });
  }

  // Mark user as verified and remove OTP
  user.otp = null;
  user.otpExpires = null;
  user.isVerified = true;
  await user.save();

  res.redirect("/login");
});

router.post("/resend-otp", async function (req, res) {
  const { email } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    return res.render("users/verify-otp", { error: "Invalid email", email });
  }

  // Generate new OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 1 * 60 * 1000;
  await user.save();

  // Send OTP email again
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: user.email,
    subject: "Your new OTP for FurEverHome",
    text: `Your new OTP is: ${otp}. It will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);

  res.render("users/verify-otp", {
    message: "A new OTP has been sent to your email",
    email,
  });
});

router.get("/forgot-password", (req, res) => {
  res.render("users/forgot-password");
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    return res.render("users/forgot-password", { error: "Email not found" });
  }

  // Generate a password reset token and expiration time
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
  await user.save();

  const resetLink = `http://${req.headers.host}/reset-password/${resetToken}`;

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const mailOptions = {
    from: "no-reply@fureverhome.com",
    to: user.email,
    subject: "Password Reset Request",
    text: `Click the link below to reset your password. The link is valid for 10 minutes:\n\n${resetLink}`,
  };

  await transporter.sendMail(mailOptions);

  res.render("users/forgot-password", {
    message: "A password reset link has been sent to your email",
  });
});

router.get("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render("users/forgot-password", {
      error: "Invalid or expired token",
    });
  }

  res.render("users/reset-password", { token: req.params.token });
});

router.post("/reset-password", async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("users/reset-password", {
      error: "Passwords do not match",
      token,
    });
  }

  if (
    password.length < 8 ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*]/.test(password)
  ) {
    return res.render("users/reset-password", {
      error:
        "Password must be at least 8 characters long, contain a number, and a special character",
      token,
    });
  }

  let user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render("users/forgot-password", {
      error: "Invalid or expired token",
    });
  }

  let salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  user.isVerified = true;

  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  res.redirect("/login");
});

// Login route
router.get("/login", function (req, res, next) {
  res.render("users/login");
});
//login post
router.post("/login", async function (req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.render("users/login", { error: "Invalid email or password" });
  }

  if (!user.isVerified) {
    return res.render("users/login", {
      error: "Please verify your email first",
    });
  }

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) {
    return res.render("users/login", { error: "Incorrect password" });
  }

  req.session.user = {
    name: user.name,
    _id: user._id,
    email: user.email,
    role: user.role,
    contact: user.contact,
    image: user.image,
  };
  if (user.role === "admin") {
    res.redirect("/admin");
  } else if (user.role === "seller"){
    res.redirect("/userprofile");
  }
  else {
    res.redirect("/buyerprofile");
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
    return res
      .status(400)
      .send("Password must contain at least one special character");
  }

  const user = await User.findById(req.session.user._id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).send("Current password is incorrect");
  }

  let salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.redirect("password-updated");
});
router.get("/password-updated", (req, res) => {
  res.render("users/password-updated");
});

module.exports = router;
