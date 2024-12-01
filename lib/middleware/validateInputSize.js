// Middleware for input size validation
const validateInputSize = (messages, maxInput) => {
  const inputSize = messages.reduce((size, msg) => size + new TextEncoder().encode(msg.content).length, 0);
  if (inputSize > maxInput) {
    throw new Error(`Input size exceeds the limit of ${maxInput / 1024} KB.`);
  }
};

module.exports = { validateInputSize };