const OpenAI = require("openai");

const createChat = async (apiKey, { model, messages, maxOutput }) => {
  const openai = new OpenAI({ apiKey });

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
