var express = require("express");
var router = express.Router();
var { Product } = require("../models/product");
var checkSessionAuth = require("../middlewares/checkSessionAuth");
const validateProduct = require("../middlewares/validateProduct");
const upload = require("../middlewares/upload"); // Include multer middleware

// GET products list
router.get("/", async function (req, res, next) {
  let products = await Product.find();
  res.render("products/list", { title: "Products of pets", products });
});
//de
// Render add product page
router.get("/add", checkSessionAuth, async function (req, res, next) {
  res.render("products/add");
});

// Store data in the database (including image upload)
router.post("/add", checkSessionAuth, upload, validateProduct, async function (req, res, next) {
  let productData = req.body;
  if (req.file) {
    productData.image = '/uploads/' + req.file.filename; // Store image URL in the image field
  }
  let product = new Product(productData);
  await product.save();
  res.redirect("/products");
});

// Delete a product
router.get("/delete/:id", async function (req, res, next) {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/products");
});

// Render edit product page
router.get("/edit/:id", async function (req, res, next) {
  let product = await Product.findById(req.params.id);
  res.render("products/edit", { product });
});

// Save edited product details (including image upload)
router.post("/edit/:id", checkSessionAuth, upload, validateProduct, async function (req, res, next) {
  let product = await Product.findById(req.params.id);

  product.name = req.body.name;
  product.type = req.body.type;
  product.price = req.body.price;
  product.description = req.body.description;

  if (req.file) {
    product.image = '/uploads/' + req.file.filename; // Update the image URL if a new file is uploaded
  }

  await product.save();
  res.redirect("/products");
});

// Add a product to the cart
router.get("/cart/:id", async function (req, res, next) {
  let product = await Product.findById(req.params.id);
  let cart = req.cookies.cart || [];
  cart.push(product);
  res.cookie("cart", cart);
  res.redirect("/products");
});

// Remove a product from the cart
router.get("/cart/remove/:id", async function (req, res, next) {
  let cart = req.cookies.cart || [];
  cart = cart.filter(c => c._id !== req.params.id);
  res.cookie("cart", cart);
  res.redirect("/cart");
});

// Increment product quantity in the cart
router.post("/cart/increment/:id", async function (req, res, next) {
  let cart = req.cookies.cart || [];
  let index = cart.findIndex(c => c._id === req.params.id);

  if (index >= 0) {
    cart[index].quantity = (cart[index].quantity || 1) + 1;
  }

  res.cookie("cart", cart);
  res.redirect("/cart");
});

// Decrement product quantity in the cart
router.post("/cart/decrement/:id", async function (req, res, next) {
  let cart = req.cookies.cart || [];
  let index = cart.findIndex(c => c._id === req.params.id);

  if (index >= 0) {
    cart[index].quantity = (cart[index].quantity || 1) - 1;
    if (cart[index].quantity < 1) {
      cart.splice(index, 1);
    }
  }

  res.cookie("cart", cart);
  res.redirect("/cart");
});

module.exports = router;
