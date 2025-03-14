const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const adminAuth = require("../middlewares/adminAuth");


// GET: Add new store form
router.get("/admin/stores/new", (req, res) => {
    res.render("admin/addStore");
  });
  
  // POST: Create new store
  router.post("/stores", async (req, res) => {
    try {
      const { name, address, contact, openingTime, closingTime } = req.body;
      await Store.create({ name, address, contact, openingTime, closingTime });
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
  router.post("/admin/stores/edit/:id", async (req, res) => {
    try {
      const { name, address, contact, openingTime, closingTime } = req.body;
      await Store.findByIdAndUpdate(req.params.id, {
        name,
        address,
        contact,
        openingTime,
        closingTime,
      });
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
