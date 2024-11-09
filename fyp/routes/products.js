var express = require("express");
var router = express.Router();
var Product = require("../models/product");
var checkSessionAuth = require ("../middlewares/checkSessionAuth");
/* GET home page. */
router.get("/", async function (req, res, next) {
  let products = await Product.find();
  // console.log(products);
  res.render("products/list", { title: "Products of pets", products });
});
router.get("/add",checkSessionAuth, async function (req, res, next) {
  res.render("products/add");
});
//stores data in database
router.post("/add", async function (req, res, next) {
  let product = new Product(req.body);
  await product.save();
  res.redirect("/products");
});
//to delete a product
router.get("/delete/:id", async function (req, res, next) {
  let product = await Product.findByIdAndDelete(req.params.id);
  res.redirect("/products");
});
//to edit a product
router.get("/edit/:id", async function (req, res, next) {
  let product = await Product.findById(req.params.id);
  res.render("products/edit", { product });
});
//to save the product
router.post("/edit/:id", async function (req, res, next) {
  let product = await Product.findById(req.params.id);
  product.name = req.body.name;
  product.type = req.body.type;
  product.price = req.body.price;
  product.description = req.body.description;
  await product.save();
  res.redirect("/products");
});
//to add a product to cart
router.get("/cart/:id", async function (req, res, next) {
  let product = await Product.findById(req.params.id);
  let cart=[];
  if(req.cookies.cart) cart =req.cookies.cart;
  cart.push(product);
  res.cookie("cart",cart);
  res.redirect("/products");
});

router.get("/cart/remove/:id", async function (req, res, next) {
  
  let cart=[];
  if(req.cookies.cart) cart =req.cookies.cart;
  cart.splice(cart.findIndex(c=>c._id=req.params.id),1);
  res.cookie("cart",cart);
  res.redirect("/cart");
});
module.exports = router;
