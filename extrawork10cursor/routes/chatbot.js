const express = require('express');
const router = express.Router();
const { Pet } = require('../models/pet'); // Your pet model


//second chatbot hit
router.get('/consultation', (req, res) => {
    res.render('consult-chatbot'); // Ensure you have chatbot.pug in views folder
});
//first search chatbot hit
router.get('/', (req, res) => {
    res.render('chatbot'); // Ensure you have chatbot.pug in views folder
});
// second chatbot post
router.post('/consult-chatbot', async (req, res) => {
    const { message, previousChats } = req.body;

    // Initial system prompt
    let messages = [{ role: 'system', content: 'You are a pet Medical Assistant. Only respond to pet health-related queries. If the query is unrelated to pet health, politely decline to answer.' }];

    // Include previous chat history
    if (previousChats && Array.isArray(previousChats)) {
        previousChats.forEach(chat => {
            if (chat.message) messages.push({ role: 'user', content: chat.message });
            if (chat.response) messages.push({ role: 'assistant', content: chat.response });
        });
    }

    // Add the new user message
    messages.push({ role: 'user', content: message });
    console.log('📚 Chat History Sent:', messages);

    try {
        const response = await fetch(
            `${process.env.API_ENDPOINT}?api-version=${process.env.API_VERSION}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.API_KEY,
                },
                body: JSON.stringify({ messages }),
            }
        );

        const data = await response.json();
        const botResponse = data.choices?.[0]?.message?.content || 'I am unable to answer at the moment.';

        res.json(botResponse);
    } catch (error) {
        console.error('🚨 Chatbot API Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
async function getPetListForPrompt() {
    const pets = await Pet.find({});
    const petsDetails = pets.map(pet => (
        `Type:${pet.type}, breed:${pet.breed}, color:${pet.color}, id:${pet._id}, fee:${pet.fee}`
    )).join('\n');
    return petsDetails;
}
//first chatbot post 
router.post('/', async (req, res) => {
    const { message, previousChats } = req.body;

    let messages = [
        {
            role: 'system',
            content: `You are a helpful pet recommendation assistant. Your job is to extract user preferences from their message and return matching pets based on pet type, color, breed, and description using the given list. Respond with a short summary and a list in this exact format for each matching pet:
"Type:dog, breed:german, color:black, id:133dsf433rfd43rfgt5, fee:3212" ONLY include pets from the provided list.`
        },
        {
            role: 'user',
            content: `User input: "${message}". Here is a list of available pets:\n${await getPetListForPrompt()}`
        }
    ];

    try {
        const response = await fetch(
            `${process.env.API_ENDPOINT}?api-version=${process.env.API_VERSION}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.API_KEY,
                },
                body: JSON.stringify({ messages }),
            }
        );

        const data = await response.json();
        let success = true;
        const botResponse = data.choices?.[0]?.message?.content;
        console.log('🤖 Chatbot Response:', botResponse);
        if (botResponse.toLowerCase().includes('no pets', 'no pets found', 'no pets available','unfortunately')) {
            success = false;
        }
        res.json({ pets: botResponse, success });
    } catch (error) {
        console.error('🚨 Chatbot API Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
// frist chatbot all pets result hit 
router.get('/pet/:id', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).send('Pet not found');
        }
        res.render('pets/petsdetails', { title: pet.name, pet });
    } catch (error) {
        console.error('Error finding the pet details', error);
        res.status(500).send('Internal server error');
    }
});
module.exports = router;
