var express = require("express");
var router = express.Router();
var Product = require("../models/product");
/* GET home page. */
router.get("/", function (req, res, next) {
  let products = Product.find();
  console.log(products);
  res.render("products/list");
});

module.exports = router;
