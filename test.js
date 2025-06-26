require('dotenv').config();
const fs = require('fs');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load the system prompt
const systemPrompt = fs.readFileSync('system-prompt.txt', 'utf8');

async function loadPdfText() {
    const buffer = fs.readFileSync('kickball-rules.pdf');
    const data = await pdf(buffer);
    return data.text;
}

async function testQuestion(question) {
    const pdfText = await loadPdfText();

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Here is the rulebook:\n\n${pdfText}\n\nQuestion: ${question}`
            }
        ]
    });

    const answer = response.choices[0].message.content;
    console.log("\n🤖 GPT-4o Answer:");
    console.log(answer);
}

// 🔍 CHANGE THIS to test different questions:
testQuestion("Can an infielder step beyond the imaginary line connecting 1st and 3rd base?");
