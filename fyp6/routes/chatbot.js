const express = require('express');
const router = express.Router();
const {Pet} = require('../models/pet'); // Your pet model
const natural = require('natural');

router.get('/', (req, res) => {
    res.render('chatbot'); // Ensure you have chatbot.pug in views folder
});
router.post('/', async (req, res) => {
    try {
        const userMessage = req.body.message.toLowerCase();
        console.log('User Message:', userMessage);

        // Dynamic search: Match user input against name, description, and type
        const matchingPets = await Pet.find({
            $or: [
                { name: { $regex: userMessage, $options: 'i' } },
                { description: { $regex: userMessage, $options: 'i' } },
                { type: { $regex: userMessage, $options: 'i' } }
            ]
        });

        console.log('Matching Pets:', matchingPets);

        if (matchingPets.length === 0) {
            return res.json({ message: "😔 No pets match your description." });
        }

        res.json({ message: "🐾 Here are the pets we found:", pets: matchingPets });
    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ error: "⚠️ Internal server error." });
    }
});

module.exports = router;
