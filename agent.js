const express = require("express");
const path = require("path");
const { OpenAI } = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Regex to detect a URL
const urlRegex = /(https?:\/\/[^\s]+)/g;

// Function to fetch and extract webpage content
const extractWebpageContent = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }, // Bypass some bot protections
    });

    const $ = cheerio.load(data);
    const pageText = $("body").text().replace(/\s+/g, " ").trim();
    return pageText;
  } catch (error) {
    console.error("Error fetching webpage:", error);
    return "Failed to extract content from the webpage.";
  }
};

// Function to extract Job Details using OpenAI
const extractJobDetails = async (text) => {
  const prompt = `
Extract only the job details from the following text. 
Provide three sections:
 "The job description" - describe the job opportunity.  
"What You Will Be Doing" - describe the responsibilities.  
 "What We Are Looking For" - list the required qualifications.  
Ignore irrelevant information.  
  
### Input Text:  
${text}  
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Error processing job details.";
  }
};

// Handle chat messages
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const urls = userMessage.match(urlRegex);

  try {
    if (urls && urls.length > 0) {
      const url = urls[0]; // Process only the first detected URL
      const content = await extractWebpageContent(url);
      const jobDetails = await extractJobDetails(content);
      res.json({ message: jobDetails });
    } else {
      // Handle normal chatbot interaction
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      });

      res.json({ message: response.choices[0].message.content });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Sorry, something went wrong. Please try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
