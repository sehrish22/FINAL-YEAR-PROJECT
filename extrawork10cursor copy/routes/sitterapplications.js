var express = require("express");
var router = express.Router();
var SitterApplication = require("../models/SitterApplication");
var PetSitter = require("../models/PetSitter");
const adminAuth = require("../middlewares/adminAuth");


// Show PetSitter Application Form
router.get("/sitter-application", (req, res) => {
  res.render("sitter-application");
});

// Handle PetSitter Form Submission
router.post("/sitter-application", async (req, res) => {
  try {
    const { name, email, phone, address, experience, pets } = req.body;
    const newApplication = new SitterApplication({
      name,
      email,
      phone,
      address,
      experience,
      pets: pets.split(",").map((pet) => pet.trim()),
    });
    await newApplication.save();
    res.redirect("/sitter-success");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error submitting application.");
  }
});

// Show Success Page
router.get("/sitter-success", (req, res) => {
  res.render("sitter-success");
});

// Display Applications in Admin Dashboard
router.get("/admin-sitter-application", async (req, res) => {
  try {
    const applications = await SitterApplication.find();
    res.render("admin/admin-sitter-application", { applications });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading applications.");
  }
});

// Delete Sitter Application
router.post("/admin-sitter-application/delete/:id", async (req, res) => {
  try {
    const deleted = await SitterApplication.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).send("Application not found.");
    }
    res.redirect("/admin/admin-sitter-application");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting application.");
  }
});

// Approve and Add PetSitter
router.post("/admin/add-petsitter/:id", async (req, res) => {
  try {
    const application = await SitterApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).send("Application not found.");
    }
    // Create new PetSitter from application
    // (No email uniqueness check, allowing multiple sitters with same email)
    const newSitter = new PetSitter({
      name: application.name,
      email: application.email,
      phone: application.phone,
      address: application.address,
      experience: application.experience,
      pets: application.pets,
    });

    await newSitter.save();

    // Optionally, delete application after approval
    await SitterApplication.findByIdAndDelete(req.params.id);

    res.redirect("/admin/admin-sitter-application");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding PetSitter.");
  }
});
module.exports = router;
