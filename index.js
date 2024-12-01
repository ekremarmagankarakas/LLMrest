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

  // Function to return results as they are available
  const streamChatResults = async function* ({ models, messages, maxInput, maxOutput, moderationEnabled }) {
    // Validate input size
    validateInputSize(messages, maxInput);

    // Perform moderation check if enabled
    if (moderationEnabled) {
      await moderationCheck(apiKeys.openai, messages);
    }

    // Process each model individually and yield results
    for (const model of models) {
      try {
        let result;
        if (model.startsWith('gpt')) {
          result = await openaiChat(apiKeys.openai, { model, messages, maxOutput });
        } else if (model.startsWith('claude')) {
          result = await claudeChat(apiKeys.claude, { model, messages, maxOutput });
        } else if (model.startsWith('gemini')) {
          result = await geminiChat(apiKeys.gemini, { model, messages, maxOutput });
        } else if (model.startsWith('llama')) {
          result = await perplexityChat(apiKeys.perplexity, { model, messages, maxOutput });
        } else {
          throw new Error(`Unsupported model: ${model}`);
        }
        yield { model, result }; // Successful response
      } catch (error) {
        yield { model, error: error.message || 'An unknown error occurred' }; // Error details
      }
    }
  };

  return { createChat, streamChatResults };
};

module.exports = { createAIClient };
