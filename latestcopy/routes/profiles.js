const express = require("express");
const router = express.Router();
var { User } = require("../models/user");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Orders Route
router.get("/profiles", async function (req, res, next) {
  let users = await User.find();
  res.render("admin/profiles", { users });
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
// Route to show individual user profile (buyer or seller)
const { Order } = require("../models/order");
const { AdoptionRequest } = require("../models/adoptionrequest");

router.get("/profiles/:id", async function (req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    let orders = [];
    let adoptionRequests = [];

    if (user.role === "buyer") {
      orders = await Order.find({ userId: user._id });
      adoptionRequests = await AdoptionRequest.find({ userId: user._id }).populate('petId');
    } else if (user.role === "seller") {
      // You may already have logic for sellers elsewhere, but you can fetch seller-specific data here if needed
    }

    res.render("admin/profilDetail", {
      user,
      orders,
      adoptionRequests
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Export the router
module.exports = router;
