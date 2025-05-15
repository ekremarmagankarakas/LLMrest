const { transformMessages } = require("../middleware/transformMessages");
const Anthropic = require("@anthropic-ai/sdk");

const createChat = async (apiKey, { model, messages, maxOutput }) => {
  const anthropic = new Anthropic({ apiKey });

  const transformedMessages = transformMessages(messages, "anthropic");

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxOutput,
      messages: transformedMessages,
    });
    return response.content[0].text;
  } catch (error) {
    throw new Error(`Error processing request with Claude: ${error.message}`);
  }
};

module.exports = { createChat };
