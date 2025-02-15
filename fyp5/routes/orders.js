const express = require("express");
const router = express.Router();
var { Order } = require("../models/order");
const validateOrder = require("../middlewares/validateOrder");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Orders Route
router.get("/orders", async function (req, res, next) {
  let orders = await Order.find();
  res.render("admin/orders", { orders });
});
// Store data in the database (including image upload)
router.post(
  "/checkout",
  upload,
  validateOrder,
  async function (req, res, next) {
    let orderData = req.body;
    
    let order = new Order(orderData);
    await order.save();

    console.log(req.cookies);
    req.cookies.cart = [];
    res.redirect("/");
  }
);
// Export the router
module.exports = router;
