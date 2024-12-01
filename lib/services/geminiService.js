const { transformMessages } = require('../middleware/transformMessages');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const createChat = async (apiKey, { model, messages, maxOutput }) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const transformedMessages = transformMessages(messages, 'gemini');

  // Map roles to Gemini's expected format
  const geminiMessages = transformedMessages.map((msg) => {
    let role = msg.role;

    if (role === 'assistant') {
      role = 'model'; // Map assistant to model
    } else if (!['user', 'model', 'function', 'system'].includes(role)) {
      throw new Error(`Invalid role "${role}". Valid roles are: ["user", "model", "function", "system"].`);
    }

    return {
      role,
      parts: [{ text: msg.content }],
    };
  });

  try {
    const modelInstance = genAI.getGenerativeModel({ model });

    const chat = modelInstance.startChat({
      history: geminiMessages,
      generationConfig: { max_output_tokens: maxOutput },
    });

    const result = await chat.sendMessage(geminiMessages[geminiMessages.length - 1].parts[0].text);

    return result.response.text();
  } catch (error) {
    throw new Error(`Error processing request with Gemini: ${error.message}`);
  }
};

module.exports = { createChat };
