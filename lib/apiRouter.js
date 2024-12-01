const express = require('express');
const { createChat: openaiChat } = require('./services/openaiService');
const { createChat: claudeChat } = require('./services/claudeService');
const { createChat: geminiChat } = require('./services/geminiService');

const apiRouter = (apiKeys) => {
  const router = express.Router();

  // OpenAI Chat
  router.post('/openai/chat', async (req, res) => {
    try {
      const { model, messages, maxInput, maxOutput, moderationEnabled } = req.body;
      const result = await openaiChat(apiKeys.openai, { model, messages, maxInput, maxOutput, moderationEnabled });
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Claude Chat
  router.post('/claude/chat', async (req, res) => {
    try {
      const { model, messages, maxInput, maxOutput, moderationEnabled } = req.body;
      const result = await claudeChat(apiKeys.claude, { model, messages, maxInput, maxOutput, moderationEnabled });
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Gemini Chat
  router.post('/gemini/chat', async (req, res) => {
    try {
      const { model, messages, maxInput, maxOutput, moderationEnabled } = req.body;
      const result = await geminiChat(apiKeys.gemini, { model, messages, maxInput, maxOutput, moderationEnabled });
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};

module.exports = apiRouter;
