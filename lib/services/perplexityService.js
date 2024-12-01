const OpenAI = require('openai');

const createChat = async (apiKey, { model, messages, maxOutput }) => {
  const perplexity = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.perplexity.ai',
  });
  
  // Call Perplexity API
  try {
    const response = await perplexity.chat.completions.create({
      model,
      messages,
      max_tokens: maxOutput,
    });
    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`Error processing request: ${error.message}`);
  }
};

module.exports = { createChat };
