const { createChat: openaiChat } = require('./lib/services/openaiService');
const { createChat: claudeChat } = require('./lib/services/claudeService');
const { createChat: geminiChat } = require('./lib/services/geminiService');
const { createChat: perplexityChat } = require('./lib/services/perplexityService');
const { moderationCheck } = require('./lib/middleware/moderationCheck');
const { validateInputSize } = require('./lib/middleware/validateInputSize');

const createAIClient = ({ apiKeys }) => {
  if (!apiKeys || typeof apiKeys !== 'object') {
    throw new Error('API keys are required.');
  }

  const createChat = async ({ models, messages, maxInput, maxOutput, moderationEnabled }) => {
    // Validate input size
    validateInputSize(messages, maxInput);

    // Perform moderation check if enabled
    if (moderationEnabled) {
      await moderationCheck(apiKeys.openai, messages);
    }

    // Call the appropriate services for each model
    const results = await Promise.allSettled(
      models.map((model) => {
        if (model.startsWith('gpt')) {
          return openaiChat(apiKeys.openai, { model, messages, maxOutput });
        }
        if (model.startsWith('claude')) {
          return claudeChat(apiKeys.claude, { model, messages, maxOutput });
        }
        if (model.startsWith('gemini')) {
          return geminiChat(apiKeys.gemini, { model, messages, maxOutput });
        }
        if (model.startsWith('llama')) {
          return perplexityChat(apiKeys.perplexity, { model, messages, maxOutput });
        }
        return Promise.reject(new Error(`Unsupported model: ${model}`));
      })
    );

    // Aggregate results
    return models.reduce((acc, model, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        acc[model] = result.value; // Successful response
      } else {
        acc[model] = { error: result.reason.message || 'An unknown error occurred' }; // Error details
      }
      return acc;
    }, {});
  };

  const createChatMessages = async ({ models, messages, maxInput, maxOutput, moderationEnabled }) => {
    if (!messages || typeof messages !== 'object') {
      throw new Error('Messages must be an object with model-specific messages.');
    }

    // Validate and perform moderation for each model's messages
    await Promise.all(
      models.map(async (model) => {
        if (!messages[model]) {
          throw new Error(`No messages provided for model: ${model}`);
        }

        validateInputSize(messages[model], maxInput);

        if (moderationEnabled) {
          await moderationCheck(apiKeys.openai, messages[model]);
        }
      })
    );

    // Call the appropriate services for each model
    const results = await Promise.allSettled(
      models.map((model) => {
        if (model.startsWith('gpt')) {
          return openaiChat(apiKeys.openai, { model, messages: messages[model], maxOutput });
        }
        if (model.startsWith('claude')) {
          return claudeChat(apiKeys.claude, { model, messages: messages[model], maxOutput });
        }
        if (model.startsWith('gemini')) {
          return geminiChat(apiKeys.gemini, { model, messages: messages[model], maxOutput });
        }
        if (model.startsWith('llama')) {
          return perplexityChat(apiKeys.perplexity, { model, messages: messages[model], maxOutput });
        }
        return Promise.reject(new Error(`Unsupported model: ${model}`));
      })
    );

    // Aggregate results
    return models.reduce((acc, model, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        acc[model] = result.value; // Successful response
      } else {
        acc[model] = { error: result.reason.message || 'An unknown error occurred' }; // Error details
      }
      return acc;
    }, {});
  };

  return { createChat, createChatMessages };
};

module.exports = { createAIClient };
