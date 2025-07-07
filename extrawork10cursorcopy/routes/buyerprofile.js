const express = require("express");
const router = express.Router();
const User = require("../models/user"); // Adjust path based on your project
const { Order } = require("../models/order");
const checkSessionAuth = require("../middlewares/checkSessionAuth"); 
const upload = require("../middlewares/upload"); // Include multer middleware
const { AdoptionRequest } = require("../models/adoptionrequest");

// Get buyer profile with orders and adoption requests
router.get("/", checkSessionAuth, async function (req, res, next) {
  try {
    const user = req.session.user;
    
    // Fetch orders with populated product details
    const orders = await Order.find({ userId: user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    // Fetch adoption requests with populated pet details
    const adoptionrequests = await AdoptionRequest.find({ userId: user._id })
      .populate('petId')
      .sort({ createdAt: -1 });

    res.render("buyerprofile/buyerprofile", {
      user,
      orders,
      adoptionrequests
    });
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Render edit profile page
router.get("/editbuyerprofile", checkSessionAuth, async (req, res) => {
    try {
      console.log("Edit profile route hit");
  
      const user = await User.findById(req.session.user._id);
      if (!user) return res.redirect("/login");
      res.render("buyerprofile/editbuyerprofile", { user });
    } catch (error) {
      console.error("Error loading edit profile:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Process edit profile form with image upload
  router.post("/editbuyerprofile",upload , checkSessionAuth, async (req, res) => {
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
  
      res.redirect("/buyerprofile"); // or wherever you want to redirect
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).send("Internal Server Error");
    }
  });
module.exports = router;
