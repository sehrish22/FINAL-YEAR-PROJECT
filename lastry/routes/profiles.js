const express = require("express");
const router = express.Router();
var { User } = require("../models/user");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Orders Route
router.get("/profiles", async function (req, res, next) {
  let users = await User.find();
  res.render("admin/profiles", { users });
});
// Store data in the database (including image upload)
router.post(
  "/register",
  upload,
  async function (req, res, next) {
    let userData = req.body;
    let user = new User(userData);
    await user.save();

    console.log(req.cookies);
    req.cookies.cart = [];
    res.redirect("/");
  }
);
// Export the router
module.exports = router;
