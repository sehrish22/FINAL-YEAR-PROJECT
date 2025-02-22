const express = require("express");
const router = express.Router();
var { AdoptionRequest } = require("../models/adoptionrequest");
const validateAdoptionRequest = require("../middlewares/validateAdoptionRequest");
const upload = require("../middlewares/upload"); // Include multer middleware

// Admin Adoptionrequests Route
router.get("/adoptionrequests", async function (req, res, next) {
  let adoptionrequests = await AdoptionRequest.find();
  res.render("admin/adoptionrequests", { adoptionrequests });
});
// Store data in the database (including image upload)
router.post(
  "/adoptionrequests",
  upload,
  validateAdoptionRequest,
  async function (req, res, next) {
    let adoptionrequestData = req.body;
    let adoptionrequest = new AdoptionRequest(adoptionrequestData);
    await adoptionrequest.save();
    res.redirect("/pets");
  }
);
// Export the router
module.exports = router;
