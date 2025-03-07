const express = require("express");
const router = express.Router();
var { Order } = require("../models/order");
const adminAuth = require("../middlewares/adminAuth");
//extra work for image
// const User = require("../models/user"); // Import User model

// Admin Panel Home Route (optional)
router.get("/", adminAuth,async (req, res) => {
  const ordersCount = await Order.countDocuments(); // Get total order count
  console.log("🟢 Orders Count:", ordersCount);
  res.render("admin/admin", { ordersCount });
});

module.exports = router;
