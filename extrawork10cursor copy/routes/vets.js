const express = require("express");
const router = express.Router();
const Vet = require("../models/vet");
const adminAuth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload"); // Add multer middleware


// GET: Add new vet form
router.get("/new", adminAuth, (req, res) => {
  res.render("admin/addVet");
});

// POST: Create new vet
router.post("/", upload, adminAuth, async (req, res) => {
  try {
    const { name, address, contact, openingTime, closingTime, description } = req.body;
    const vetData = {
      name,
      address,
      contact,
      openingTime,
      closingTime,
      description
    };

    // Add image path if an image was uploaded
    if (req.file) {
      vetData.image = "/uploads/" + req.file.filename;
    }

    await Vet.create(vetData);
    res.redirect("/vets");
  } catch (error) {
    console.error("Error adding vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

// GET: Edit vet form
router.get("/edit/:id", adminAuth, async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id);
    res.render("admin/editVet", { vet });
  } catch (error) {
    console.error("Error fetching vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

// POST: Update vet
router.post("/edit/:id", upload, adminAuth, async (req, res) => {
  try {
    const { name, address, contact, openingTime, closingTime, description } = req.body;
    const updateData = {
      name,
      address,
      contact,
      openingTime,
      closingTime,
      description
    };

    // Add image path if a new image was uploaded
    if (req.file) {
      updateData.image = "/uploads/" + req.file.filename;
    }

    await Vet.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/vets");
  } catch (error) {
    console.error("Error updating vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

// GET: Delete vet
router.get("/delete/:id", adminAuth, async (req, res) => {
  try {
    await Vet.findByIdAndDelete(req.params.id);
    res.redirect("/vets");
  } catch (error) {
    console.error("Error deleting vet:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;