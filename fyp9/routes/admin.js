const express = require("express");
const router = express.Router();
var { Order } = require("../models/order");
//extra work for image 
// const User = require("../models/user"); // Import User model

// Admin Panel Home Route (optional)
router.get("/",async (req, res) => {
  const ordersCount = await Order.countDocuments(); // Get total order count
  console.log("🟢 Orders Count:", ordersCount);
    res.render("admin/admin", { ordersCount });
});

module.exports = router;
