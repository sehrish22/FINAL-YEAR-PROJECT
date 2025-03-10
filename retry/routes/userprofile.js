const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { AdoptionRequest } = require("../models/adoptionrequest"); // Ensure this model exists
const { User } = require("../models/user");

// User Profile Dashboard Route
router.get("/", async (req, res) => {
  if (!req.session.user) return res.redirect("/login"); // Ensure user is logged in

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login"); // Handle missing user

    // Fetch orders where uploadedBy matches the logged-in user's ID
    const orders = await Order.find({
      items: {
        $elemMatch: { "product.uploadedBy": req.session.user._id },
      },
    });

    const ordersCount = orders.length;

    // Fetch adoption requests specific to the user
    const adoptionrequests = await AdoptionRequest.find({ userId: user._id });

    res.render("userprofile/userprofile", {
      ordersCount,
      user,
      orders,
      adoptionrequests,
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
