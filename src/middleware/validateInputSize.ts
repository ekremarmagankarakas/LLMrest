import type { Message } from '../types';

export const validateInputSize = (messages: Message[], maxInput?: number): void => {
  if (!maxInput) return;

  const inputSize = messages.reduce(
    (size, msg) => size + new TextEncoder().encode(msg.content).length,
    0,
  );

  if (inputSize > maxInput) {
    throw new Error(
      `Input size (${inputSize} bytes) exceeds the limit of ${maxInput} bytes.`,
    );
  }
};
