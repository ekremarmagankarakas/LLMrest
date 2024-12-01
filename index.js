const express = require('express');
const apiRouter = require('./lib/apiRouter');
const { createChat: openaiChat } = require('./lib/services/openaiService');
const { createChat: claudeChat } = require('./lib/services/claudeService');
const { createChat: geminiChat } = require('./lib/services/geminiService');

const createServer = ({ apiKeys }) => {
  if (!apiKeys || typeof apiKeys !== 'object') {
    throw new Error('API keys are required to initialize the server.');
  }

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Attach API Router
  app.use('/api', apiRouter(apiKeys));

  // Aggregate results from multiple models
  const createChat = async ({ models, messages, maxInput, maxOutput, moderationEnabled }) => {
    const results = await Promise.all(
      models.map(async (model) => {
        if (model.startsWith('gpt')) {
          return openaiChat(apiKeys.openai, { model, messages, maxInput, maxOutput, moderationEnabled });
        }
        if (model.startsWith('claude')) {
          return claudeChat(apiKeys.claude, { model, messages, maxInput, maxOutput, moderationEnabled });
        }
        if (model.startsWith('gemini')) {
          return geminiChat(apiKeys.gemini, { model, messages, maxInput, maxOutput, moderationEnabled });
        }
        throw new Error(`Unsupported model: ${model}`);
      })
    );

    // Structure results by model
    return models.reduce((acc, model, index) => {
      acc[model] = results[index];
      return acc;
    }, {});
  };

  return {
    app,
    createChat,
  };
};

module.exports = createServer;
