const { OpenAI } = require('openai');
require('dotenv').config();
console.log('API Key:', process.env.myOPENAI_API_KEY);

exports.handler = async (event) => {
  const openai = new OpenAI({ apiKey: process.env.myOPENAI_API_KEY });
  
  // Parse the incoming request body
  const { message } = JSON.parse(event.body);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    const botMessage = response.choices[0].message.content;
    return {
      statusCode: 200,
      body: JSON.stringify({ message: botMessage }),
    };
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong. Please try again later.' }),
    };
  }
};
