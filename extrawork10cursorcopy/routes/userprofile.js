const express = require("express");
const router = express.Router();
const { AdoptionRequest } = require("../models/adoptionrequest");
const { User } = require("../models/user");
const { Pet } = require("../models/pet");
const { Product } = require("../models/product");
const checkSessionAuth = require("../middlewares/checkSessionAuth");
const upload = require("../middlewares/upload");
var { Order } = require("../models/order");

// User Profile Dashboard Route
router.get("/", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    let adoptionrequests;
    let ordersCount;

    if (user.role === "admin") {
      // Admin sees all adoption requests and orders
      adoptionrequests = await AdoptionRequest.find()
        .populate('petId')
        .populate('userId');
      ordersCount = await Order.countDocuments();
    } else {
      // Seller sees only their pets' adoption requests
      const sellerPets = await Pet.find({ uploadedBy: user._id });
      adoptionrequests = await AdoptionRequest.find({
        petId: { $in: sellerPets.map(pet => pet._id) }
      }).populate('petId').populate('userId');

      // Count orders containing products uploaded by this seller
      const sellerProducts = await Product.find({ uploadedBy: user._id });
      ordersCount = await Order.countDocuments({
        'items.product': { $in: sellerProducts.map(product => product._id) }
      });
    }

    res.render("userprofile/userprofile", {
      user,
      adoptionrequests,
      ordersCount,
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Orders Route
router.get("/orders", checkSessionAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    let orders;

    if (user.role === "admin") {
      // Admin sees all orders
      orders = await Order.find()
        .populate('userId')
        .populate('items.product');
    } else {
      // Seller sees orders containing their products
      const sellerProducts = await Product.find({ uploadedBy: user._id });
      orders = await Order.find({
        'items.product': { $in: sellerProducts.map(product => product._id) }
      }).populate('userId').populate('items.product');
    }

    res.render("userprofile/orders", { 
      user,
      orders 
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Adoption Requests Route
router.get("/adoptionrequests", checkSessionAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    let adoptionrequests;

    if (user.role === "admin") {
      // Admin sees all adoption requests
      adoptionrequests = await AdoptionRequest.find()
        .populate('petId')
        .populate('userId');
    } else {
      // Seller sees only their pets' adoption requests
      const sellerPets = await Pet.find({ uploadedBy: user._id });
      adoptionrequests = await AdoptionRequest.find({
        petId: { $in: sellerPets.map(pet => pet._id) }
      }).populate('petId').populate('userId');
    }

    res.render("userprofile/adoptionrequests", { 
      user,
      adoptionrequests 
    });
  } catch (error) {
    console.error("Error loading adoption requests:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Render edit profile page
router.get("/editprofile", checkSessionAuth, async (req, res) => {
  try {
    console.log("Edit profile route hit");

    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");
    res.render("userprofile/editprofile", { user });
  } catch (error) {
    console.error("Error loading edit profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Process edit profile form with image upload
router.post("/editprofile",upload , checkSessionAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    // Update fields
    user.name = req.body.name;
    user.email = req.body.email;
    user.contact = req.body.contact;
    user.storeName = req.body.storeName;

    // If an image file is provided, update the image path
    if (req.file) {
      user.image = "/uploads/" + req.file.filename;
    }

    await user.save();
    console.log(req.body);

    // Optionally, update the session information too:
    req.session.user.name = user.name;
    req.session.user.email = user.email;

    res.redirect("/userprofile"); // or wherever you want to redirect
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Delete profile route
router.post("/delete", checkSessionAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    // Clear the session
    req.session.destroy();
    
    // Redirect to home page
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Update Adoption Request Status (Seller only)
router.post("/adoptionrequests/update-status/:requestId", checkSessionAuth, async function (req, res) {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user || user.role !== "seller") {
      return res.status(403).send("Unauthorized");
    }

    const { requestId } = req.params;
    const { newStatus } = req.body;

    console.log("Updating adoption request:", requestId, "to status:", newStatus); // Debug log

    if (!["Pending", "Approved", "Rejected"].includes(newStatus)) {
      console.log("Invalid status value:", newStatus); // Debug log
      return res.status(400).send("Invalid status value.");
    }

    const adoptionRequest = await AdoptionRequest.findById(requestId)
      .populate({
        path: "petId",
        populate: {
          path: "uploadedBy"
        }
      });

    if (!adoptionRequest) {
      console.log("Adoption request not found:", requestId); // Debug log
      return res.status(404).send("Adoption request not found");
    }

    // Verify that the pet belongs to this seller
    if (!adoptionRequest.petId || !adoptionRequest.petId.uploadedBy || 
        adoptionRequest.petId.uploadedBy._id.toString() !== user._id.toString()) {
      console.log("Unauthorized - Pet does not belong to seller:", user._id); // Debug log
      return res.status(403).send("Unauthorized - Pet does not belong to you");
    }

    // Update adoption request status
    const updatedRequest = await AdoptionRequest.findByIdAndUpdate(
      requestId,
      { status: newStatus },
      { new: true }
    );

    console.log("Successfully updated adoption request:", updatedRequest); // Debug log

    res.redirect("/userprofile/adoptionrequests");
  } catch (error) {
    console.error("Error updating adoption request status:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

