var express = require("express");
var router = express.Router();var Cart = require("../models/cart");
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home");
});
router.get("/stores", function (req, res, next) {
  res.render("stores");
});
router.get("/clinics", function (req, res, next) {
  res.render("clinics");
});
router.get("/petsitters", function (req, res, next) {
  res.render("petsitters");
});
router.get("/cart",async function (req, res, next) {
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

module.exports = router;
