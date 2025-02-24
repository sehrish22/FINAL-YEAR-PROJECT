const express = require("express");
const router = express.Router();
//extra work for image 
// const User = require("../models/user"); // Import User model

// Admin Panel Home Route (optional)
router.get("/", (req, res) => {
  res.render("admin/admin");
});
// //extra work for image 
// router.get("/dashboard", async (req, res) => {
//   try {
//     if (!req.session.user) {
//       return res.redirect("/login"); // Redirect if not logged in
//     }

//     const seller = await User.findById(req.session.user); // Get seller data

//     res.render("admin", { user }); // Pass seller data to Pug
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });
// Export the router
module.exports = router;
