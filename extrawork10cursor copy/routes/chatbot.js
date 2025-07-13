const express = require('express');
const router = express.Router();
const { Pet } = require('../models/pet'); // Your pet model


//second chatbot hit
router.get('/consultation', (req, res) => {
    res.render('consult-chatbot'); // Ensure you have chatbot.pug in views folder
});
//first search chatbot
router.get('/search', (req, res) => {
    res.render('search-chatbot'); // Ensure you have chatbot.pug in views folder
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
//first chatbot
router.get('/', (req, res) => {
    res.render('chatbot'); // Ensure you have chatbot.pug in views folder
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
//first chatbot details page hit 
router.get("/:id", async (req, res) => {
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
// search chatbot post(result show)
router.post('/search-chatbot', async (req, res) => {
    const { prompt, context } = req.body;

    try {
        const messages = [
            { role: 'system', content: 'You are a pet search assistant. Ask follow-up questions to refine the search and suggest the best matching pets from the database.' },
        ];

        if (context && Array.isArray(context)) {
            context.forEach(({ role, content }) => {
                messages.push({ role, content });
            });
        }

        messages.push({ role: 'user', content: prompt });

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
        const botResponse = data.choices?.[0]?.message?.content.trim();

        let pets = [];
        let usedQuery = false;

        if (botResponse.toLowerCase().includes('query:')) {
            const queryString = botResponse.split('query:')[1].trim();

            try {
                const query = JSON.parse(queryString);
                pets = await Pet.find(query);
                usedQuery = true;
            } catch (err) {
                console.error('Error parsing query:', err);
                return res.status(500).json({ error: 'Invalid query format returned by OpenAI.' });
            }
        } else {
            // Intelligent fallback — search by keywords
            const keywords = prompt.toLowerCase();

            const noFur = keywords.includes('no fur') || keywords.includes('without fur') || keywords.includes("don't want fur");

            const baseQuery = {};

            if (noFur) {
                baseQuery.type = { $in: ['Bird', 'Reptile', 'Fish'] }; // filter fur-less types
            }

            pets = await Pet.find(baseQuery);
        }

        const formattedPets = pets.map(p =>
            `name: ${p.name}\nlink: http://localhost:5000/chatbot/pet/${p._id}`
        ).join('\n\n');

        const finalMessage = pets.length > 0
            ? `${botResponse}\n\nHere are some pets you might like:\n\n${formattedPets}`
            : `${botResponse}\n\n😔 Sorry, no pets match your description. Try again!`;

        return res.json({
            message: finalMessage,
            context: messages,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});


module.exports = router;
