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
    res.send("Application submitted successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error submitting application.");
  }
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

// Approve and Add PetSitter
router.post("/admin/add-petsitter/:id", async (req, res) => {
  try {
    const application = await SitterApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).send("Application not found.");
    }

    // Check if PetSitter already exists
    const existingSitter = await PetSitter.findOne({ email: application.email });
    if (existingSitter) {
      return res.status(400).send("PetSitter with this email already exists.");
    }

    // Create new PetSitter from application
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
// Delete PetSitter
router.post("/admin/delete-petsitter/:id", adminAuth, async (req, res) => {
  try {
    console.log("Delete request received for ID:", req.params.id);

    const deletedSitter = await PetSitter.findByIdAndDelete(req.params.id);
    if (!deletedSitter) {
      console.log("PetSitter not found");
      return res.status(404).send("PetSitter not found.");
    }
    console.log("PetSitter deleted successfully");
    res.redirect("/petsitters");
  } catch (error) {
    console.error("Error deleting PetSitter:", error);
    res.status(500).send("Error deleting PetSitter.");
  }
});
module.exports = router;
