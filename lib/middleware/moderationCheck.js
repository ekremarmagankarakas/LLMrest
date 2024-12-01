const OpenAI = require('openai');

// Middleware for moderation check
const moderationCheck = async (openaiApiKey, messages) => {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const moderation = await openai.moderations.create({
    input: messages.map((msg) => msg.content),
  });

  const flagged = moderation.results.some((result) => result.flagged);
  if (flagged) {
    throw new Error('Input contains restricted or potentially harmful content.');
  }
};

module.exports = { moderationCheck };