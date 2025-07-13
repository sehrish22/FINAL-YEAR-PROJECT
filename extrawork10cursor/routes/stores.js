const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const adminAuth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload"); // Add multer middleware

//get all stores
router.get("/stores", async function (req, res, next) {
  const stores = await Store.find();
  res.render("stores", { stores });
});
// GET: Add new store form
router.get("/admin/stores/new", (req, res) => {
    res.render("admin/addstore");
  });
  
  // POST: Create new store
  router.post("/stores", upload, async (req, res) => {
    try {
      const { name, address, contact, openingHour,openingPeriod,
        closingHour,
        closingPeriod } = req.body;
        const openingTime = `${openingHour} ${openingPeriod}`;
    const closingTime = `${closingHour} ${closingPeriod}`;
      const storeData = { 
        name, 
        address, 
        contact, 
        openingTime, 
        closingTime 
      };

      // Add image path if an image was uploaded
      if (req.file) {
        storeData.image = "/uploads/" + req.file.filename;
      }

      await Store.create(storeData);
      res.redirect("/stores");
    } catch (error) {
      console.error("Error adding store:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // GET: Edit store form
  router.get("/admin/stores/edit/:id", async (req, res) => {
    try {
      const store = await Store.findById(req.params.id);
      res.render("admin/editStore", { store });
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // POST: Update store
  router.post("/admin/stores/edit/:id", upload, async (req, res) => {
    try {
      const { name, address, contact, openingHour,openingPeriod,
        closingHour,
        closingPeriod } = req.body;
      const openingTime = `${openingHour} ${openingPeriod}`;
    const closingTime = `${closingHour} ${closingPeriod}`;
      const updateData = {
        name,
        address,
        contact,
        openingTime,
        closingTime,
      };

      // Add image path if a new image was uploaded
      if (req.file) {
        updateData.image = "/uploads/" + req.file.filename;
      }

      await Store.findByIdAndUpdate(req.params.id, updateData);
      res.redirect("/stores");
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // GET: Delete store
  router.get("/admin/stores/delete/:id", async (req, res) => {
    try {
      await Store.findByIdAndDelete(req.params.id);
      res.redirect("/stores");
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  

module.exports = router;
