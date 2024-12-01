const OpenAI = require('openai');

const createChat = async (apiKey, { model, messages, maxInput, maxOutput, moderationEnabled }) => {
  const openai = new OpenAI({ apiKey });

  // Call OpenAI API
  try {
    const response = await openai.chat.completions.create({
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
