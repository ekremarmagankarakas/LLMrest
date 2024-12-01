const transformMessages = (messages, target) => {
  if (!['anthropic', 'gemini'].includes(target)) {
    throw new Error(`Invalid target: ${target}. Supported targets are "anthropic" and "gemini".`);
  }

  const transformedMessages = [];
  for (const message of messages) {
    if (message.role === 'system') {
      // Replace system message with user + model messages
      transformedMessages.push(
        { role: 'user', content: message.content },
        target === 'gemini'
          ? { role: 'model', content: 'Okay' }
          : { role: 'assistant', content: 'Okay' },
      );
    } else {
      // Keep other messages unchanged
      transformedMessages.push(message);
    }
  }
  return transformedMessages;
};

module.exports = { transformMessages };