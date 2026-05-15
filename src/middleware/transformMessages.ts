import type { Message } from '../types';

type TransformTarget = 'anthropic' | 'gemini';

export const transformMessages = (messages: Message[], target: TransformTarget): Message[] => {
  const result: Message[] = [];

  for (const message of messages) {
    if (message.role === 'system') {
      result.push(
        { role: 'user', content: message.content },
        { role: target === 'gemini' ? 'assistant' : 'assistant', content: 'Okay' },
      );
    } else {
      result.push(message);
    }
  }

  return result;
};
