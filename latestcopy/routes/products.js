var express = require("express");
var router = express.Router();
var { Product } = require("../models/product");
var { Order } = require("../models/order");
const Cart = require("../models/cart");
var { User } = require("../models/user");
var checkSessionAuth = require("../middlewares/checkSessionAuth");
const validateProduct = require("../middlewares/validateProduct");
const validateOrder = require("../middlewares/validateOrder");
const upload = require("../middlewares/upload"); // Include multer middleware
const mongoose = require("mongoose");
var { v4: uuidv4 } = require("uuid"); // For generating unique session IDs
const crypto = require("crypto");
const Review = require("../models/Review");
const flash = require("connect-flash"); // make sure you have this middleware in your app.js

function generateOrderId() {
  return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}
//get all products
router.get("/", async function (req, res, next) {
  try {
    const filter = {};
    const query = req.query;

    if (query.type) filter.type = new RegExp(query.type, 'i');
    if (query.name) filter.name = new RegExp(query.name, 'i');
    if (query.price) filter.price = { $lte: query.price };
    if (query.storeName) filter.storeName = new RegExp(query.storeName, 'i');

    const products = await Product.find(filter);

    const loggedInUserId = req?.session?.user?._id || null;
    let userProducts = [];
    let otherProducts = [];

    if (loggedInUserId) {
      userProducts = products.filter((p) => p.uploadedBy == loggedInUserId);
      otherProducts = products.filter((p) => p.uploadedBy != loggedInUserId);
    } else {
      otherProducts = products;
    }

    const sortedProducts = [...userProducts, ...otherProducts];

    res.render("products/list", {
      title: "Products",
      products: sortedProducts,
      loggedInUserId,
      query, // 👈 Pass current query to prefill the search fields
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Render add product page
router.get("/add", checkSessionAuth, async function (req, res, next) {
  res.render("products/add");
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
    let user = req.session.user;
    productData.uploadedBy = req.session.user._id;
    let product = new Product(productData);

    if (user.storeName) {
      product.storeName = user.storeName; // Store the store name in the product document
    }

    console.log(user.storeName);

    console.log(product.storeName);
    await product.save();
    console.log(product);
    res.redirect("/products");
  }
);
//checkout page
router.get("/checkout", checkSessionAuth, async function (req, res, next) {
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

  res.render("checkout", { user: req.user, cart: cart.items, total, orderId });
});
//save data on checkout page
router.post("/checkout", async function (req, res, next) {
  try {
    // Ensure session exists
    const sessionId = req.session.sessionId;
    const userId = req.session.user._id;
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
        console.error(
          `❌ Insufficient stock for ${product.name}. Available: ${product.instock}, Requested: ${item.quantity}`
        );
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
      uploadedBy: item.product.uploadedBy,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    console.log("💵 Total amount:", total);

    // Create and save order
    const orderId = generateOrderId();
    const order = new Order({
      userId,
      sellerId: cart.items[0].product.uploadedBy,
      name,
      email,
      contact,
      address,
      items,
      total,
      orderId,
    });
    console.log("✅ Order saved successfully:", order);
    await order.save();
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

    res.redirect("/products/order-placed");
  } catch (error) {
    console.error("❌ Error during checkout:", error);
    res.status(500).send(`Something went wrong: ${error.message}`);
  }
});
router.get("/order-placed", async (req, res) => {
  try {
    // Get the most recent order for the current user
    const order = await Order.findOne({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product');

    if (!order) {
      return res.redirect('/products');
    }

    // Format the order date
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate estimated delivery (2-3 days from order date)
    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
    const formattedDelivery = estimatedDelivery.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    res.render("order-placed", {
      order,
      orderId: order.orderId,
      orderDate,
      deliveryAddress: order.address,
      estimatedDelivery: formattedDelivery
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.redirect('/products');
  }
});

// Get products by uploadedBy (store)
router.get("/store/:userId", async function (req, res, next) {
  try {
    const userId = req.params.userId;
    const products = await Product.find({ uploadedBy: userId });

    if (!products || products.length === 0) {
      return res.render("products/store", {
        products: [],
        storeName: "Unknown Store",
        userId: userId,
      });
    }

    res.render("products/store", {
      products: products,
      storeName: products[0].storeName,
      userId: userId,
    });
  } catch (error) {
    next(error);
  }
});
// Get details of a product
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const reviews = await Review.find({ product: productId })
      .populate("product user")
      .exec();

    let hasPurchased = false;
    if (req.session.user) {
      // Check if the user has purchased the product
      const order = await Order.findOne({
        userId: req.session.user._id,
        "items.product": productId,
      });

      if (order) {
        hasPurchased = true;
      }

      // Check if the user has already reviewed the product
      const existingReview = await Review.findOne({
        product: productId,
        user: req.session.user._id,
      });

      const hasReviewed = existingReview ? true : false; // Set this value

      // Pass the data to the template
      res.render("products/details", {
        product,
        reviews,
        user: req.session.user,
        hasPurchased,
        hasReviewed, // Pass this info
      });
    } else {
      res.render("products/details", {
        product,
        reviews,
        user: req.session.user,
        hasPurchased,
        hasReviewed: false, // No review if user is not logged in
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//delete a product
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
  const product = await Product.findById(req.params.id).populate("uploadedBy");
  if (!product) {
    req.flash("error", "Product not found.");
    return res.redirect("/products");
  }

  // Ensure session ID
  if (!req.session.sessionId) {
    req.session.sessionId = uuidv4();
  }
  const sessionId = req.session.sessionId;
  let error = "";
  // Find or create cart
  let cart = await Cart.findOne({ sessionId }).populate({
    path: "items.product",
    populate: { path: "uploadedBy" },
  });

  if (!cart) {
    cart = new Cart({ sessionId, items: [] });
  }

  // If cart is not empty, check for store consistency
  if (cart.items.length > 0) {
    const existingStoreId = cart.items[0].product.uploadedBy._id.toString();
    const newProductStoreId = product.uploadedBy._id.toString();

    if (existingStoreId !== newProductStoreId) {
      req.flash("error", "❌ You can only order from one store at a time.");
      error = "❌ You can only order from one store at a time.";
      return res.redirect("/products");
    }
  }

  // Add or update quantity
  const existingItem = cart.items.find((item) =>
    item.product._id.equals(product._id)
  );

  if (existingItem) {
    if (existingItem.quantity + 1 > product.instock) {
      req.flash("error", `Only ${product.instock} units available.`);
      error = `Only ${product.instock} units available.`;
      return res.redirect("/products");
    }
    existingItem.quantity += 1;
  } else {
    if (product.instock < 1) {
      req.flash("error", "Product is out of stock.");
      error = "Product is out of stock.";
      return res.redirect("/products");
    }
    cart.items.push({ product: product._id, quantity: 1, error });
  }

  await cart.save();
  req.flash("success", "Product added to cart successfully!");
  res.redirect("/products");
});

// Remove a product from the cart
router.get("/cart/remove/:id", async function (req, res, next) {
  const sessionId = req.session.sessionId;
  await Cart.updateOne(
    { sessionId },
    { $pull: { items: { product: req.params.id } } }
  );
  res.redirect("/cart");
});
// Increment product quantity in the cart
router.post("/cart/increment/:id", async function (req, res, next) {
  try {
    const sessionId = req.session.sessionId;
    const product = await Product.findById(req.params.id);

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/cart");
    }

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      req.flash("error", "Cart not found");
      return res.redirect("/cart");
    }

    const item = cart.items.find((item) => item.product.equals(product._id));
    if (!item) {
      req.flash("error", "Product not found in cart");
      return res.redirect("/cart");
    }

    if (item.quantity + 1 > product.instock) {
      req.flash("error", `Only ${product.instock} products are available in stock`);
      return res.redirect("/cart");
    }

    item.quantity += 1;
    await cart.save();
    res.redirect("/cart");
  } catch (error) {
    console.error("Error in increment route:", error);
    req.flash("error", "Failed to update quantity");
    res.redirect("/cart");
  }
});

// Decrement product quantity in the cart
router.post("/cart/decrement/:id", async function (req, res, next) {
  try {
    const sessionId = req.session.sessionId;
    const cart = await Cart.findOne({ sessionId });

    if (!cart) {
      req.flash("error", "Cart not found");
      return res.redirect("/cart");
    }

    const item = cart.items.find((item) => item.product.equals(req.params.id));
    if (!item) {
      req.flash("error", "Product not found in cart");
      return res.redirect("/cart");
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
      await cart.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("Error in decrement route:", error);
    req.flash("error", "Failed to update quantity");
    res.redirect("/cart");
  }
});
//post review
router.post("/:id/review", async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    const user = req.session.user;
    if (!user) {
      req.flash("error", "Please log in first.");
      return res.status(401).send("Please log in first.");
    }
    const hasPurchased = await Order.findOne({
      userId: user._id,
      "items.product": req.params.id, // "items" array contains this product
    });
    if (!hasPurchased) {
      return res
        .status(403)
        .send("You can only review products you have purchased.");
    }
    if (!product) return res.status(404).send("Product not found");

    const newReview = new Review({
      product: product._id,
      rating: parseInt(rating),
      comment,
      user,
    });

    await newReview.save();
    res.redirect(`/products/${product._id}`);
  } catch (error) {
    console.error("Review post error:", error); // 👈 Add this
    res.status(500).send("Error adding review");
  }
});

module.exports = router;
