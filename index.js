require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;

// Load system prompt from file
const systemPrompt = fs.readFileSync('system-prompt.txt', 'utf8');

// Load the PDF once at startup
let pdfText = '';
async function loadPdfText() {
    const dataBuffer = fs.readFileSync('kickball-rules.pdf');
    const data = await pdf(dataBuffer);
    pdfText = data.text;
}

app.post('/groupme-webhook', async (req, res) => {
    const data = req.body;

    if (data.sender_type === 'bot') return res.sendStatus(200); // avoid echo

    const userMessage = data.text;

    try {
        const gptResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: `Here is the rulebook:\n\n${pdfText}\n\nQuestion: ${userMessage}`
                }
            ]
        });

        const reply = gptResponse.choices[0].message.content;

        await axios.post('https://api.groupme.com/v3/bots/post', {
            bot_id: GROUPME_BOT_ID,
            text: reply
        });

        res.sendStatus(200);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
        res.sendStatus(500);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await loadPdfText(); // Load PDF at startup
    console.log(`Ref bot is live on port ${PORT}`);
});
