const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { Product } = require("../models/product");

// GET Orders (Admin & Seller)
router.get("/orders", async function (req, res) {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/login");

    let orders = [];

    if (user.role === "admin") {
      // Admin can view all orders
      orders = await Order.find().populate("items.product").exec();
      return res.render("admin/orders", { orders, userRole: user.role });
    } else if (user.role === "seller") {
      // Seller can only view orders that contain their products
      const sellerProducts = await Product.find({ uploadedBy: user._id }).select("_id");
      const sellerProductIds = sellerProducts.map(p => p._id.toString());

      let sellerOrders = await Order.find({
        "items.product": { $in: sellerProductIds }
      }).populate("items.product").exec();

      // Filter seller's relevant order items
      sellerOrders = sellerOrders
        .map(order => {
          const filteredItems = order.items.filter(item =>
            item.product && sellerProductIds.includes(item.product._id.toString())
          );
          return filteredItems.length ? { ...order.toObject(), items: filteredItems } : null;
        })
        .filter(order => order !== null);

      return res.render("userprofile/orders", { orders: sellerOrders });
    } else {
      // Buyers can only see their own orders
      const buyerOrders = await Order.find({ userId: user._id }).sort({ orderDate: -1 });
      return res.render("buyerprofile/buyerprofile", { user, orders: buyerOrders });
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Update Order Status (Only Seller Can Update Status)
router.post("/orders/update-status/:orderId", async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/login");

    const { orderId } = req.params;
    const { newStatus } = req.body;

    if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(newStatus)) {
      return res.status(400).send("Invalid status value.");
    }

    // Find the order and check if the seller has permission to update
    let order = await Order.findById(orderId);

    if (!order) return res.status(404).send("Order not found.");

    // Sellers can only update orders containing their products
    const sellerProductIds = (await Product.find({ uploadedBy: user._id }).select("_id"))
      .map(p => p._id.toString());

    const hasSellerProduct = order.items.some(item =>
      item.product && sellerProductIds.includes(item.product.toString())
    );

    if (!hasSellerProduct) return res.status(403).send("You can only update your own orders.");

    // Update order status and ensure it persists
    await Order.findByIdAndUpdate(orderId, { orderStatus: newStatus });

    console.log(`Order ${orderId} updated to: ${newStatus}`);

    // Redirect based on user role
    if (user.role === "admin") {
      return res.redirect("/admin/orders");
    } else {
      return res.redirect("/userprofile/orders");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
