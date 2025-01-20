const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Serve the static files in the directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(express.json());

// OpenAI API setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle user chat messages
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Use GPT-3.5-turbo model
      messages: [{ role: 'user', content: userMessage }],
    });

    const botMessage = response.choices[0].message.content;
    res.json({ message: botMessage });
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    res.status(500).json({ message: 'Sorry, something went wrong. Please try again later.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
