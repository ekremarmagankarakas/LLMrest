const { validateInputSize } = require('../middleware/inputValidation');
const { moderationCheck } = require('../middleware/moderationCheck');

const Anthropic = require('@anthropic-ai/sdk');

const createChat = async (apiKey, { model, messages, maxInput, maxOutput, moderationEnabled }) => {
  const anthropic = new Anthropic({ apiKey });

  // Validate input size
  validateInputSize(messages, maxInput);

  // Perform moderation check if enabled
  if (moderationEnabled) {
    await moderationCheck(apiKey, messages);
  }

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxOutput,
      messages,
    });
    return response.content[0].text;
  } catch (error) {
    throw new Error(`Error processing request with Claude: ${error.message}`);
  }
};

module.exports = { createChat };
