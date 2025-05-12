const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter'); // Import the model

router.post('/subscribe', async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).send('Name and Email are required');
    }

    try {
        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).send('Already subscribed');
        }

        const newSubscriber = new Newsletter({ name, email });
        await newSubscriber.save();
        res.render("subscribed");

    } catch (error) {
        res.status(500).send('Server error');
    }
});
router.get("/subscribed", (req, res) => {
    res.render("subscribed");
  });
module.exports = router;
