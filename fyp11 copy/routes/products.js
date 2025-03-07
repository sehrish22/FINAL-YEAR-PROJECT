var express = require("express");
var router = express.Router();
var { Product } = require("../models/product");
var { Order } = require("../models/order");
const Cart = require('../models/cart');
var checkSessionAuth = require("../middlewares/checkSessionAuth");
const validateProduct = require("../middlewares/validateProduct");
const validateOrder = require("../middlewares/validateOrder");
const upload = require("../middlewares/upload"); // Include multer middleware
const mongoose = require("mongoose");
var { v4: uuidv4 } = require('uuid'); // For generating unique session IDs
const crypto = require("crypto");

function generateOrderId() {
  return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}
// GET products list
router.get("/", async function (req, res, next) {
  let filter = {};
  if (req.query.type) {
    filter.type = req.query.type; // Filter by type if provided
  }
  let products = await Product.find(filter);
  res.render("products/list", { title: "Products of pets", products });
});
// Render add product page
router.get("/add", checkSessionAuth, async function (req, res, next) {
  res.render("products/add");
  console.log(req,res,next,"lets see");
});
// Store data in the database (including image upload)
router.post(
  "/add",
  checkSessionAuth,
  upload,
  validateProduct,
  async function (req, res, next) {
    let productData = req.body;
    console.log("lets see, req.body");
    if (req.file) {
      productData.image = "/uploads/" + req.file.filename; // Store image URL in the image field
    }
    let product = new Product(productData);
    await product.save();
    res.redirect("/products");
  }
);
//checkout page
router.get("/checkout", async function (req, res, next) {
  const sessionId = req.session.sessionId;
  const cart = await Cart.findOne({ sessionId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return res.redirect("/cart");
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const orderId = generateOrderId();

  res.render("checkout", { cart: cart.items, total, orderId });
});
router.post("/checkout", async function (req, res, next) {
  try {
    // Ensure session exists
    const sessionId = req.session.sessionId;
    if (!sessionId) {
      console.error("❌ No session ID found");
      return res.status(400).send("Session not found.");
    }

    // Fetch the cart and populate products
    const cart = await Cart.findOne({ sessionId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      console.error("❌ Cart not found or empty.");
      return res.redirect("/cart");
    }

    console.log("🛒 Cart details:", JSON.stringify(cart, null, 2));

    // Check stock availability for each product
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        console.error(`❌ Product not found for ID: ${item.product._id}`);
        return res.status(400).send("Product not found.");
      }
      if (item.quantity > product.instock) {
        console.error(`❌ Insufficient stock for ${product.name}. Available: ${product.instock}, Requested: ${item.quantity}`);
        return res.status(400).send(`Not enough stock for ${product.name}.`);
      }
    }

    // Extract user details
    const { email, name, address, contact } = req.body;
    console.log("📧 User details:", { email, name, address, contact });

    // Prepare order items
    const items = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      quantity: item.quantity,
      price: item.product.price,
      subtotal: item.product.price * item.quantity,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    console.log("💵 Total amount:", total);

    // Create and save order
    const order = new Order({ name, email, contact, address, items, total });
    await order.save();
    console.log("✅ Order saved successfully:", order);

    // Update stock quantities
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { instock: -item.quantity },
      });
      console.log(`📦 Stock updated for: ${item.product.name}`);
    }

    // Clear the cart
    await Cart.deleteOne({ sessionId });
    console.log("🗑️ Cart cleared.");

    res.redirect("/");
  } catch (error) {
    console.error("❌ Error during checkout:", error);
    res.status(500).send(`Something went wrong: ${error.message}`);
  }
});

//get details of a product
router.get("/:id", async (req, res) => {
  try {
      const product = await Product.findById(req.params.id);
      if (!product) {
          return res.status(404).send("Product not found");
      }
      res.render("products/details", { title: product.name, product });
  } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
  }
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
router.post(
  "/edit/:id",
  checkSessionAuth,
  upload,
  validateProduct,
  async function (req, res, next) {
    let product = await Product.findById(req.params.id);

    product.name = req.body.name;
    product.type = req.body.type;
    product.price = req.body.price;
    product.description = req.body.description;
    product.instock = req.body.instock;

    if (req.file) {
      product.image = "/uploads/" + req.file.filename; // Update the image URL if a new file is uploaded
    }

    await product.save();
    res.redirect("/products");
  }
);

// Add a product to the cart
router.get("/cart/:id", async function (req, res, next) { 
  const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/products");
    // Generate or retrieve sessionId
    if (!req.session.sessionId) {
      req.session.sessionId = uuidv4();
    }
    const sessionId = req.session.sessionId;

    // Find or create cart for session
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    // Check if product is already in cart
    const existingItem = cart.items.find((item) => item.product.equals(product._id));
    if (existingItem) {
      if (existingItem.quantity + 1 > product.instock) {
        return res.status(400).send(`Only ${product.instock} units available.`);
      }
      existingItem.quantity += 1;
    } else {
      if (product.instock < 1) {
        return res.status(400).send(`Product is out of stock.`);
      }
      cart.items.push({ product: product._id, quantity: 1 });
    }

    await cart.save();
    res.redirect("/products");
});

// Remove a product from the cart
router.get("/cart/remove/:id", async function (req, res, next) {
  const sessionId = req.session.sessionId;
  await Cart.updateOne({ sessionId }, { $pull: { items: { product: req.params.id } } });
  res.redirect("/cart");
});

// Increment product quantity in the cart
router.post("/cart/increment/:id", async function (req, res, next) {
  const sessionId = req.session.sessionId;
  const product = await Product.findById(req.params.id);

  if (!product) return res.redirect("/products");

  const cart = await Cart.findOne({ sessionId });
  const item = cart.items.find((item) => item.product.equals(product._id));

  if (item) {
    if (item.quantity + 1 > product.instock) {
      return res.status(400).send(`Only ${product.instock} products are available.`);
    }
    item.quantity += 1;
    await cart.save();
  }
    res.redirect("/cart");
});

// Decrement product quantity in the cart and update stock
router.post("/cart/decrement/:id", async function (req, res, next) {
  try {
    const sessionId = req.session.sessionId;
    const cart = await Cart.findOne({ sessionId });

    if (!cart) return res.redirect("/cart");

    // Find item in the cart
    const item = cart.items.find((item) => item.product.equals(req.params.id));

    if (item) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).send("Product not found");

      // Ensure 'instock' is treated as a number
      const currentStock = parseInt(product.instock, 10);

      // Check if the item can be decremented
      if (item.quantity > 1) {
        item.quantity -= 1;

        // Increment stock by 1 when the cart quantity decreases
        await Product.findByIdAndUpdate(item.product, {
          $inc: { instock: 1 },
        });
      } else {
        // Remove item if quantity is 1 and update stock
        cart.items = cart.items.filter((item) => !item.product.equals(req.params.id));

        // Restore stock by 1 if the item is removed
        await Product.findByIdAndUpdate(item.product, {
          $inc: { instock: 1 },
        });
      }

      // Save the updated cart
      await cart.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("❌ Error in decrement route:", error);
    res.status(500).send("Something went wrong.");
  }
});


module.exports = router;
