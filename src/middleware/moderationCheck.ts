import OpenAI from 'openai';
import type { Message } from '../types';

export const moderationCheck = async (openaiApiKey: string, messages: Message[]): Promise<void> => {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const moderation = await openai.moderations.create({
    input: messages.map((msg) => msg.content),
  });

  const flagged = moderation.results.some((result) => result.flagged);
  if (flagged) {
    throw new Error('Input contains restricted or potentially harmful content.');
  }
};
