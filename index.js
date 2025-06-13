const { createChat: openaiChat } = require('./lib/services/openaiService');
const { createChat: claudeChat } = require('./lib/services/claudeService');
const { createChat: geminiChat } = require('./lib/services/geminiService');
const { createChat: perplexityChat } = require('./lib/services/perplexityService');
const { moderationCheck } = require('./lib/middleware/moderationCheck');
const { validateInputSize } = require('./lib/middleware/validateInputSize');

const openaiModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt4.1'];
const claudeModels = ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
const geminiModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash-live-001', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-pro-preview-06-05'];
const perplexityModels = ['llama-3.1-sonar-small-128k-online'];

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
        if (openaiModels.includes(model)) {
          return openaiChat(apiKeys.openai, { model, messages, maxOutput });
        }
        if (claudeModels.includes(model)) {
          return claudeChat(apiKeys.claude, { model, messages, maxOutput });
        }
        if (geminiModels.includes(model)) {
          return geminiChat(apiKeys.gemini, { model, messages, maxOutput });
        }
        if (perplexityModels.includes(model)) {
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
        if (openaiModels.includes(model)) {
          return openaiChat(apiKeys.openai, { model, messages: messages[model], maxOutput });
        }
        if (claudeModels.includes(model)) {
          return claudeChat(apiKeys.claude, { model, messages: messages[model], maxOutput });
        }
        if (geminiModels.includes(model)) {
          return geminiChat(apiKeys.gemini, { model, messages: messages[model], maxOutput });
        }
        if (perplexityModels.includes(model)) {
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

  const createChatStreaming = async ({ models, messages, maxInput, maxOutput, moderationEnabled, onResponse }) => {
    if (!onResponse || typeof onResponse !== 'function') {
      throw new Error('onResponse callback function is required for streaming.')
    }

    if (typeof messages === 'object' && !Array.isArray(messages)) {
      // Handle model-specific messages
      await Promise.all(
        models.map(async (model) => {
          if (!messages[model]) {
            throw new Error(`No messages provided for model: ${model}`)
          }

          validateInputSize(messages[model], maxInput)

          if (moderationEnabled) {
            await moderationCheck(apiKeys.openai, messages[model])
          }
        })
      )

      // Start all model requests concurrently and stream responses as they arrive
      models.forEach(async (model) => {
        try {
          let result
          if (openaiModels.includes(model)) {
            result = await openaiChat(apiKeys.openai, { model, messages: messages[model], maxOutput })
          } else if (claudeModels.includes(model)) {
            result = await claudeChat(apiKeys.claude, { model, messages: messages[model], maxOutput })
          } else if (geminiModels.includes(model)) {
            result = await geminiChat(apiKeys.gemini, { model, messages: messages[model], maxOutput })
          } else if (perplexityModels.includes(model)) {
            result = await perplexityChat(apiKeys.perplexity, { model, messages: messages[model], maxOutput })
          } else {
            throw new Error(`Unsupported model: ${model}`)
          }

          // Stream successful response
          onResponse({
            model,
            status: 'success',
            data: result,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          // Stream error response
          onResponse({
            model,
            status: 'error',
            error: error.message || 'An unknown error occurred',
            timestamp: new Date().toISOString()
          })
        }
      })
    } else {
      // Handle same messages for all models
      validateInputSize(messages, maxInput)

      if (moderationEnabled) {
        await moderationCheck(apiKeys.openai, messages)
      }

      // Start all model requests concurrently and stream responses as they arrive
      models.forEach(async (model) => {
        try {
          let result
          if (openaiModels.includes(model)) {
            result = await openaiChat(apiKeys.openai, { model, messages, maxOutput })
          } else if (claudeModels.includes(model)) {
            result = await claudeChat(apiKeys.claude, { model, messages, maxOutput })
          } else if (geminiModels.includes(model)) {
            result = await geminiChat(apiKeys.gemini, { model, messages, maxOutput })
          } else if (perplexityModels.includes(model)) {
            result = await perplexityChat(apiKeys.perplexity, { model, messages, maxOutput })
          } else {
            throw new Error(`Unsupported model: ${model}`)
          }

          // Stream successful response
          onResponse({
            model,
            status: 'success',
            data: result,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          // Stream error response
          onResponse({
            model,
            status: 'error',
            error: error.message || 'An unknown error occurred',
            timestamp: new Date().toISOString()
          })
        }
      })
    }
  }

  return { createChat, createChatMessages, createChatStreaming };
};

module.exports = { createAIClient };
