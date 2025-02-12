const express = require("express");
const router = express.Router();
var { Order } = require("../models/user");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Orders Route
router.get("/orders", async function (req, res, next) {
  let orders = await Order.find();
  res.render("admin/profiles", { profiles });
});
// Store data in the database (including image upload)
router.post(
  "/register",
  upload,
  async function (req, res, next) {
    let userData = req.body;
    let user = new User(userData);
    await user.save();

    console.log(req.cookies);
    req.cookies.cart = [];
    res.redirect("/");
  }
);
// Export the router
module.exports = router;
