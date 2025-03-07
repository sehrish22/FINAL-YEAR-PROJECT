const express = require("express");
const router = express.Router();
var { Order } = require("../models/order");
const { Cart } = require("../models/cart");
const validateOrder = require("../middlewares/validateOrder");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Orders Route
router.get("/orders", async function (req, res, next) {
  const orders = await Order.find().populate("items.product").exec();
    res.render("admin/orders", { orders });
});
// Export the router
module.exports = router;
