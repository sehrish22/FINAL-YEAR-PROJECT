const express = require('express');
const router = express.Router();
const {Pet} = require('../models/pet'); // Your pet model
const natural = require('natural');

router.get('/', (req, res) => {
    res.render('chatbot'); // Ensure you have chatbot.pug in views folder
});
router.post('/', async (req, res) => {
    try {
        const pets = await Pet.find({});
        console.log('All Pets in Database:', pets);

        const userMessage = req.body.message.toLowerCase();
        console.log('💬 User Message:', userMessage); 

        // Extracting keywords (splitting user message)
        const keywords = userMessage.split(' ').filter(word => word.length > 2);
        console.log('🔑 Extracted Keywords:', keywords);

        // Build a query to search across name, description, and type fields
        const query = {
            $or: keywords.map(keyword => ({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { type: { $regex: keyword, $options: 'i' } }
                ]
            }))
        };

        console.log('🔍 Generated Query:', JSON.stringify(query, null, 2));

        const matchingPets = await Pet.find(query);
        console.log('🐾 Matching Pets:', matchingPets);

        if (matchingPets.length === 0) {
            return res.json({ message: "😔 Sorry, no pets match your description. Try again!" });
        }

        res.json({ message: "🐾 Here are the pets matching your description:", pets: matchingPets });

    } catch (error) {
        console.error('🚨 Chatbot Error:', error);
        res.status(500).json({ error: "Internal server error." });
    }
});
// router.get('/pet/:id', async (req, res) => {
//     try {
//         const pet = await Pet.findById(req.params.id);
//         if (!pet) {
//             return res.status(404).send('Pet not found');
//         }
//         res.render('pet-results', { pet });
//     } catch (error) {
//         console.error('Error finding the pet details', error);
//         res.status(500).send('Internal server error');
//     }
// });
router.get("/pet/:id", async (req, res) => {
  const petId = req.params.id;

  // Ensure the petId is a valid ObjectId before querying
  if (!petId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send("Invalid Pet ID");
  }

  const pet = await Pet.findById(petId);
  if (!pet) {
      return res.status(404).send("Pet not found");
  }

  res.render("pets/petsdetails", { title: pet.name, pet });
});


module.exports = router;
