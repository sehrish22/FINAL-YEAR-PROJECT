require("dotenv").config();
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

router.post("/register", upload, async function (req, res) {
  let errors = {};
  const { email, password } = req.body;

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

  // Check if this is a JSON request
  const isJsonRequest = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.indexOf('json') > -1);

  // If any errors exist, return appropriate response
  if (Object.keys(errors).length > 0) {
    if (isJsonRequest) {
      return res.status(400).json({ error: Object.values(errors)[0] });
    }
    return res.render("users/register", { errors, req });
  }

  try {
    // Handle uploaded image
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

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

    if (isJsonRequest) {
      return res.json({ 
        success: true, 
        email: user.email,
        redirect: `/users/verify-otp?email=${user.email}` 
      });
    }
    res.redirect(`/users/verify-otp?email=${user.email}`); // Redirect to OTP verification page
  } catch (err) {
    if (isJsonRequest) {
      return res.status(500).json({ error: "An error occurred during registration" });
    }
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
  
  // Check if this is a JSON request
  const isJsonRequest = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.indexOf('json') > -1);

  let user = await User.findOne({ email });
  if (!user) {
    if (isJsonRequest) {
      return res.status(400).json({ error: "Invalid email" });
    }
    return res.render("users/verify-otp", { error: "Invalid email", email });
  }

  if (user.otp !== otp || Date.now() > user.otpExpires) {
    if (isJsonRequest) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
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

  if (isJsonRequest) {
    return res.json({ 
      success: true, 
      redirect: "/?showLogin=true" 
    });
  }
  res.redirect('/?showLogin=true');
});

router.post("/resend-otp", async function (req, res) {
  const { email } = req.body;
  
  // Check if this is a JSON request
  const isJsonRequest = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
  
  let user = await User.findOne({ email });

  if (!user) {
    if (isJsonRequest) {
      return res.status(400).json({ error: "Invalid email" });
    }
    return res.render("users/verify-otp", { error: "Invalid email", email });
  }

  // Generate new OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
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

  if (isJsonRequest) {
    return res.json({ 
      success: true, 
      message: "A new OTP has been sent to your email" 
    });
  }
  
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
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "Email not found" });
    }
    return res.render("users/forgot-password", { error: "Email not found" });
  }

  // Generate a password reset token and expiration time
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
  await user.save();

  const resetLink = `http://${req.headers.host}/users/reset-password/${resetToken}`;

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

  try {
    await transporter.sendMail(mailOptions);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true,
        message: "A password reset link has been sent to your email"
      });
    }
    res.render("users/forgot-password", {
      message: "A password reset link has been sent to your email",
    });
  } catch (error) {
    console.error('Error sending email:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "Failed to send reset email. Please try again." });
    }
    res.render("users/forgot-password", {
      error: "Failed to send reset email. Please try again.",
    });
  }
});

router.get("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect('/?error=invalid_token');
    }

    // Redirect to home with token
    res.redirect(`/?reset_token=${req.params.token}`);
  } catch (error) {
    console.error('Error in reset password:', error);
    res.redirect('/?error=server_error');
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ error: "Passwords do not match" });
      }
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
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({
          error: "Password must be at least 8 characters long, contain a number, and a special character"
        });
      }
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
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
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

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true,
        message: "Password has been reset successfully"
      });
    }
    res.redirect("/login");
  } catch (error) {
    console.error('Error in reset password:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ error: "An error occurred. Please try again." });
    }
    res.redirect('/?error=server_error');
  }
});

// Login route
router.get("/login", function (req, res, next) {
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    // If it's an AJAX request, return JSON
    res.json({ success: true });
  } else {
    // If it's a regular request, render the login page
    res.render("users/login");
  }
});

//login post
router.post("/login", async function (req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "Invalid email or password" });
    }
    return res.render("users/login", { error: "Invalid email or password" });
  }

  if (!user.isVerified) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "Please verify your email first" });
    }
    return res.render("users/login", { error: "Please verify your email first" });
  }

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "Incorrect password" });
    }
    return res.render("users/login", { error: "Incorrect password" });
  }

  req.session.user = {
    name: user.name,
    _id: user._id,
    email: user.email,
    role: user.role,
    contact: user.contact,
    storeName: user.storeName,
    image: user.image,
  };

  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({ 
      success: true, 
      redirect: user.role === "admin" ? "/admin" : 
                user.role === "seller" ? "/userprofile" : 
                "/buyerprofile" 
    });
  }

  if (user.role === "admin") {
    res.redirect("/admin");
  } else if (user.role === "seller") {
    res.redirect("/userprofile");
  } else {
    res.redirect("/buyerprofile");
  }
});

// Logout route
router.get("/logout", function (req, res) {
  if (req.session) {
    // Clear the session
    req.session.destroy(function(err) {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Internal Server Error");
      }
      // Clear the session cookie
      res.clearCookie('sessionId');
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

// Change Password - GET
router.get("/change-password", function (req, res) {
  if (!req.session.user) return res.redirect("/login");
  res.render("users/change-password");
});

// Change Password - POST
router.post("/change-password", async function (req, res) {
  if (!req.session.user) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "Please login first" });
    }
    return res.redirect("/login");
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  let errors = {};

  // Validate passwords
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "New passwords do not match";
  }

  if (newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters long";
  }
  const digitRegex = /[0-9]/;
  if (!digitRegex.test(newPassword)) {
    errors.newPassword = "Password must contain at least one digit";
  }

  const specialCharRegex = /[!@#$%^&*]/;
  if (!specialCharRegex.test(newPassword)) {
    errors.newPassword = "Password must contain at least one special character";
  }

  // If there are any validation errors
  if (Object.keys(errors).length > 0) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ errors });
    }
    return res.render("users/change-password", { errors });
  }

  try {
    const user = await User.findById(req.session.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      errors.currentPassword = "Current password is incorrect";
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ errors });
      }
      return res.render("users/change-password", { errors });
    }

    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Determine redirect URL based on user role
    const redirectUrl = req.session.user.role === "admin" ? "/admin" : 
                       req.session.user.role === "seller" ? "/userprofile" : 
                       "/buyerprofile";

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true,
        redirect: redirectUrl
      });
    }
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in change password:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ error: "An error occurred. Please try again." });
    }
    errors.general = "An error occurred. Please try again.";
    res.render("users/change-password", { errors });
  }
});

router.get("/password-updated", (req, res) => {
  res.render("users/password-updated");
});

module.exports = router;
