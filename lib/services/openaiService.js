const { validateInputSize } = require('../middleware/inputValidation');
const { moderationCheck } = require('../middleware/moderationCheck');

const OpenAI = require('openai');

const createChat = async (apiKey, { model, messages, maxInput, maxOutput, moderationEnabled }) => {
  const openai = new OpenAI({ apiKey });

  // Validate input size
  validateInputSize(messages, maxInput);

  // Perform moderation check if enabled
  if (moderationEnabled) {
    await moderationCheck(apiKey, messages);
  }

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
