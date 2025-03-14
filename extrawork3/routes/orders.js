const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { Product } = require("../models/product");

router.get("/orders", async function (req, res) {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/login");

    if (user.role === "admin") {
      // Admin sees all orders
      const orders = await Order.find().populate("items.product").exec();
      return res.render("admin/orders", { orders });
    } else {
      // Seller: Get products uploaded by this seller
      const sellerProducts = await Product.find({ uploadedBy: user._id }).select("_id");
      const sellerProductIds = sellerProducts.map(p => p._id);

      // Fetch orders that contain at least one seller product
      let orders = await Order.find({
        "items.product": { $in: sellerProductIds }
      }).populate("items.product").exec();

      // For each order, filter out items not uploaded by this seller
      const sellerOrders = orders
        .map(order => {
          const filteredItems = order.items.filter(item =>
            item.product && sellerProductIds.some(id => id.equals(item.product._id))
          );
          return filteredItems.length ? { ...order.toObject(), items: filteredItems } : null;
        })
        .filter(order => order !== null);

      return res.render("userprofile/orders", { orders: sellerOrders });
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
