const transformMessages = (messages, target) => {
  if (!["anthropic", "gemini"].includes(target)) {
    throw new Error(
      `Invalid target: ${target}. Supported targets are "anthropic" and "gemini".`,
    );
  }

  const transformedMessages = [];
  for (const message of messages) {
    if (message.role === "system") {
      transformedMessages.push(
        { role: "user", content: message.content },
        target === "gemini"
          ? { role: "model", content: "Okay" }
          : { role: "assistant", content: "Okay" },
      );
    } else {
      transformedMessages.push(message);
    }
  }
  return transformedMessages;
};

module.exports = { transformMessages };

