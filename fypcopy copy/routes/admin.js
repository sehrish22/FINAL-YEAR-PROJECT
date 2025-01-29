const express = require("express");
const router = express.Router();

// Admin Panel Home Route (optional)
router.get("/", (req, res) => {
  res.render("admin/admin");
});

// Export the router
module.exports = router;
