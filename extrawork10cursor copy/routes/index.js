var express = require("express");
var router = express.Router();
var Cart = require("../models/cart");
var SitterApplication = require("../models/SitterApplication");
var PetSitter = require("../models/PetSitter");
const Store = require("../models/Store");
const Vet = require("../models/Vet");
const Review = require("../models/Review"); // <-- Added this line

/* GET home page. */

router.get("/stores", async function (req, res, next) {
  const stores = await Store.find();
  res.render("stores", { stores });
});

router.get("/clinics", async function (req, res, next) {
  const vets = await Vet.find();
  res.render("vets", { vets });
});

router.get("/petsitters", async function (req, res, next) {
  const petsitters = await PetSitter.find();
  res.render("petsitters", { petsitters });
});

router.get("/cart", async function (req, res, next) {
  const sessionId = req.session.sessionId;
  const cart = await Cart.findOne({ sessionId }).populate("items.product");
  
  if (!cart || cart.items.length === 0) {
    return res.render("cart", { cart: [], total: 0 });
  }

  // Calculate item subtotal and total
  const cartWithTotals = cart.items.map((item) => {
    return {
      ...item.toObject(),
      itemTotal: item.product.price * item.quantity,
    };
  });

  const total = cartWithTotals.reduce((acc, item) => acc + item.itemTotal, 0);

  res.render("cart", { cart: cartWithTotals, total });
});

// home 
router.get("/", async function (req, res, next) {
  try {
    const reviews = await Review.find()
    .sort({ createdAt: -1 })       // Sort by newest first
    .limit(3)
      .populate("user")     // populate user info
      .populate("product"); // populate product info
    res.render("home", { reviews });
    console.log("reviews",reviews);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching reviews");
  }
});
router.get("/reviews", async function (req, res, next) {
  try {
    const reviews = await Review.find()
      .populate("user")     // populate user info
      .populate("product"); // populate product info
    res.render("reviews", { reviews });
    console.log("reviews",reviews);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching reviews");
  }
});

module.exports = router;
