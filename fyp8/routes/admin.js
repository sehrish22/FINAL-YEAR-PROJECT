const express = require("express");
const router = express.Router();
//extra work for image 
// const User = require("../models/user"); // Import User model

// Admin Panel Home Route (optional)
router.get("/", (req, res) => {
  res.render("admin/admin");
});

module.exports = router;
