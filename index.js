const express = require('express');

const http = require('http');
const axios = require('axios');
const cors = require('cors');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
require('dotenv').config()

require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://realtor-clone-react-fba75.firebaseio.com"
});


const db = admin.firestore();
const handleRoutes = require('./routes/handler');



const app = express();
const server = http.createServer(app);



app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
}));

app.use(express.json());
GEMINI_API_KEY = "AIzaSyBO814hdbEJqpvSv5j1Qg7CRI5AXqmeCxs"
OPENAI_API_KEY = "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";



app.post("/ai-search", async (req, res) => {
    try {
        const { query, fbData } = req.body;

        if (!query?.trim()) {
            return res.status(400).json({
                error: "Requête invalide",
                details: "Le texte de recherche est requis"
            });
        }

        // Appel à Gemini AI


        const openaiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,

            {
                contents: [{
                    parts: [{
                        text: `Voici la data disponible dans ma base de données ${JSON.stringify(fbData)} gemini juste retourne moi un array of iDs qui correspond a cette recherche : "${query}"`
                    }]
                }]
            }


            , {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000

            });





        const rawText = openaiResponse.data.candidates[0].content.parts[0].text;

        const cleaned = rawText.replace(/```json|```/g, '').trim();

        let parsedArray;
        try {
            parsedArray = JSON.parse(cleaned);
        } catch (err) {
            console.error('Erreur de parsing JSON:', err);
            return res.status(500).json({ error: 'Erreur de format de réponse' });
        }

        return res.json(parsedArray);

    } catch (error) {
        console.error("[ERROR]", {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        res.status(500).json({ error: "Échec de la recherche" });
    }
});



app.use('/', require('./routes/handler'));



app.get("/", (req, res) => {
    res.send("Backend with Express is operational !");
});




const PORT = 4000;
server.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});
