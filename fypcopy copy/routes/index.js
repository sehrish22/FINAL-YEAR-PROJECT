var express = require("express");
var router = express.Router();

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
router.get("/cart", function (req, res, next) {
  let cart = req.cookies.cart;
  if (!cart) cart = [];
  res.render("cart", { cart });
});

module.exports = router;
