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
const  Review = require("../models/review");

function generateOrderId() {
  return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}
// show all
router.get("/", async function (req, res, next) {
  try {
    let filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const products = await Product.find(filter);

    // Separate user's own products and others
    const loggedInUserId = req?.session?.user?._id || null;
    let userProducts = [];
    let otherProducts = [];

    if (loggedInUserId) {
      userProducts = products.filter((p) => p.uploadedBy == loggedInUserId);
      otherProducts = products.filter((p) => p.uploadedBy != loggedInUserId);
    } else {
      otherProducts = products; // If no user is logged in, show all products normally
    }

    const sortedProducts = [...userProducts, ...otherProducts]; // User's products first

    res.render("products/list", {
      title: "Products",
      products: sortedProducts,
      loggedInUserId,
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
router.get("/checkout",checkSessionAuth, async function (req, res, next) {
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

  res.render("checkout", { user:req.user,cart: cart.items, total, orderId });
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
router.get("/order-placed", (req, res) => {
  res.render("order-placed");
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
    const productId = req.params.id;  // Store the product ID from the route parameter

    // Fetch the product details
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Fetch the reviews related to the product
    const reviews = await Review.find({ product: productId }).populate("product").exec();

    // Render the product details page, passing product and reviews data
    res.render("products/details", { product, reviews });
    
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
  if (!product) return res.redirect("/products");

  // Ensure session ID
  if (!req.session.sessionId) {
    req.session.sessionId = uuidv4();
  }
  const sessionId = req.session.sessionId;

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
      // Show error (use a flash message, query param, or redirect with message)
      return res
        .status(400)
        .send("❌ You can only order from one store at a time.");
    }
  }

  // Add or update quantity
  const existingItem = cart.items.find((item) =>
    item.product._id.equals(product._id)
  );
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
  await Cart.updateOne(
    { sessionId },
    { $pull: { items: { product: req.params.id } } }
  );
  res.redirect("/cart");
});

// Increment product quantity in the cart
router.post("/cart/increment/:id", async function (req, res, next) {
  const sessionId = req.session.sessionId;
  const product = await Product.findById(req.params.id);

  if (!product) return res.redirect("/products");

  const cart = await Cart.findOne({ sessionId });
  const item = cart.items.find((item) => item.product.equals(product._id));
  console.log(cart, item);

  if (item) {
    if (item.quantity + 1 > product.instock) {
      // Calculate item subtotal and total
      const cartWithTotals = cart.items.map((item) => {
        return {
          ...item.toObject(),
          itemTotal: item.product.price * item.quantity,
        };
      });

      const total = cartWithTotals.reduce(
        (acc, item) => acc + item.itemTotal,
        0
      );
      return res.render("cart", {
        cart: cartWithTotals,
        total,
        error: `Only ${product.instock} products are available in stock`,
      });
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
        await cart.save();
      } else {
        // Remove item if quantity is 1 and update stock
        cart.items = cart.items.filter(
          (item) => !item.product.equals(req.params.id)
        );

        // Restore stock by 1 if the item is removed
        await Product.findByIdAndUpdate(item.product, {
          $inc: { instock: 1 },
        });

        // Save the updated cart after removing the item
        await cart.save();
      }
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("❌ Error in decrement route:", error);
    res.status(500).send("Something went wrong.");
  }
});
//post review 
router.post("/:id/review", async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const newReview = new Review({
      product: product._id,
      rating: parseInt(rating),
      comment,
    });

    await newReview.save();
    res.redirect(`/products/${product._id}`);
  } catch (error) {
    console.error("Review post error:", error); // 👈 Add this
    res.status(500).send("Error adding review");
  }
});


module.exports = router;
