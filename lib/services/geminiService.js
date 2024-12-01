const { validateInputSize } = require('../middleware/inputValidation');
const { moderationCheck } = require('../middleware/moderationCheck');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const createChat = async (apiKey, { model, messages, maxInput, maxOutput, moderationEnabled }) => {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Validate input size
  validateInputSize(messages, maxInput);

  // Perform moderation check if enabled
  if (moderationEnabled) {
    await moderationCheck(apiKey, messages);
  }

  try {
    const modelInstance = genAI.getGenerativeModel({ model });
    const chat = modelInstance.startChat({
      history: messages,
      generationConfig: { max_output_tokens: maxOutput },
    });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return result.response.text();
  } catch (error) {
    throw new Error(`Error processing request with Gemini: ${error.message}`);
  }
};

module.exports = { createChat };
