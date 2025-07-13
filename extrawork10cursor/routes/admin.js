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
  console.log(req.session.user);
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
    const profileUser = await User.findById(req.params.id);
    if (!profileUser) {
      return res.status(404).send("User not found");
    }

    // Fetch user's products and pets
    const products = await Product.find({ uploadedBy: profileUser._id });
    const pets = await Pet.find({ uploadedBy: profileUser._id });

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

    res.render("admin/profileDetail", {
      user: req.user,             // <-- logged-in admin for navbar
      profileUser,                // <-- profile being viewed
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
    const userId = req.params.id;

    // Delete all products uploaded by this seller
    await Product.deleteMany({ uploadedBy: userId });

    // Find all pets uploaded by this seller
    const sellerPets = await Pet.find({ uploadedBy: userId }).select("_id");
    const petIds = sellerPets.map(pet => pet._id);

    // Delete adoption requests for seller's pets
    await AdoptionRequest.deleteMany({ pet: { $in: petIds } });

    // Delete the pets themselves
    await Pet.deleteMany({ uploadedBy: userId });

    // Delete all orders made to this seller
    await Order.deleteMany({ sellerId: userId });

    // Finally, delete the seller's user profile
    await User.findByIdAndDelete(userId);

    req.flash("success", "Seller and all related data deleted successfully.");
    res.redirect("/admin/profiles");
  } catch (error) {
    console.error("Error deleting seller and related data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin Adoption Requests Route
router.get("/adoptionrequests", adminAuth, async function (req, res) {
  try {
    // Fetch all adoption requests with populated data
    const adoptionrequests = await AdoptionRequest.find()
      .populate("petId")
      .populate("userId")
      .sort({ createdAt: -1 });

    res.render("admin/adoptionrequests", { adoptionrequests });
  } catch (error) {
    console.error("Error fetching adoption requests:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
