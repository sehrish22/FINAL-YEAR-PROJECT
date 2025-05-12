const express = require("express");
const router = express.Router();
const Vet = require("../models/Vet");
const adminAuth = require("../middlewares/adminAuth");

// GET: Add new vet form
router.get("/admin/vets/new", (req, res) => {
  res.render("admin/addVet");
});

// POST: Create new vet
router.post("/vets", async (req, res) => {
  try {
    const { name, address, contact, openingTime, closingTime } = req.body;
    await Vet.create({ name, address, contact, openingTime, closingTime });
    res.redirect("/clinics");
  } catch (error) {
    console.error("Error adding vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

// GET: Edit vet form
router.get("/admin/vets/edit/:id", async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id);
    res.render("admin/editVet", { vet });
  } catch (error) {
    console.error("Error fetching vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

// POST: Update vet
router.post("/admin/vets/edit/:id", async (req, res) => {
  try {
    const { name, address, contact, openingTime, closingTime } = req.body;
    await Vet.findByIdAndUpdate(req.params.id, {
      name,
      address,
      contact,
      openingTime,
      closingTime,
    });
    res.redirect("/clinics");
  } catch (error) {
    console.error("Error updating vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

// GET: Delete vet
router.get("/admin/vets/delete/:id", async (req, res) => {
  try {
    await Vet.findByIdAndDelete(req.params.id);
    res.redirect("/clinics");
  } catch (error) {
    console.error("Error deleting vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;