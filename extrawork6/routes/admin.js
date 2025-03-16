const express = require("express");
const router = express.Router();
var { Order } = require("../models/order");
const adminAuth = require("../middlewares/adminAuth");
const { User } = require("../models/user");
const checkSessionAuth = require("../middlewares/checkSessionAuth"); // Make sure this exists
const upload = require("../middlewares/upload"); // Include multer middleware
const { Product } = require("../models/product");
const { Pet } = require("../models/pet");;
const { AdoptionRequest } = require("../models/adoptionrequest");

//extra work for image
// const User = require("../models/user"); // Import User model

// Admin Panel Home Route (optional)
router.get("/", adminAuth,async (req, res) => {
  const ordersCount = await Order.countDocuments(); // Get total order count
  console.log("🟢 Orders Count:", ordersCount);
  res.render("admin/admin", { ordersCount });
});
// Render edit profile page
router.get("/editadminprofile", checkSessionAuth, async (req, res) => {
  try {
    console.log("Edit profile route hit");

    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");
    res.render("admin/editadminprofile", { user });
  } catch (error) {
    console.error("Error loading edit profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Process edit profile form with image upload
router.post("/editadminprofile",upload , checkSessionAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    // Update fields
    user.name = req.body.name;
    user.email = req.body.email;
    user.contact = req.body.contact;

    // If an image file is provided, update the image path
    if (req.file) {
      user.image = "/uploads/" + req.file.filename;
    }

    await user.save();
    console.log(req.body);

    // Optionally, update the session information too:
    req.session.user.name = user.name;
    req.session.user.email = user.email;
    req.session.user.image = user.image;
    req.session.user.contact = user.contact;

    res.redirect("/admin"); // or wherever you want to redirect
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Render user detail page with complete order and adoption request details
router.get("/profile/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch user's products and pets
    const products = await Product.find({ uploadedBy: user._id });
    const pets = await Pet.find({ uploadedBy: user._id });

    // Fetch detailed orders including product info
    const orders = await Order.find({
      "items.product": { $in: products.map((product) => product._id) },
    })
      .populate("userId", "name email contact") // Fetch user info
      .populate("items.product", "name price image"); // Fetch product info

    // Fetch adoption requests with full details
    const adoptionRequests = await AdoptionRequest.find({
      petId: { $in: pets.map((pet) => pet._id) },
    }).populate("petId", "name image type description");

    console.log("✅ Products:", products);
    console.log("✅ Pets:", pets);
    console.log("✅ Orders:", orders);
    console.log("✅ Adoption Requests:", adoptionRequests);

    res.render("admin/profileDetail", {
      user,
      products,
      pets,
      orders,
      adoptionRequests,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Delete user profile
router.post("/profile/:id/delete", adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.redirect("/admin/profiles");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
