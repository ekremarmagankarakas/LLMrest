import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base';
import { transformMessages } from '../middleware/transformMessages';
import type { ProviderChatOptions } from '../types';

export class GeminiProvider extends BaseProvider {
  private readonly genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    super();
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat({ model, messages, maxOutput }: ProviderChatOptions): Promise<string> {
    const transformed = transformMessages(messages, 'gemini');

    const geminiMessages = transformed.map((msg) => {
      let role = msg.role;
      if (role === 'assistant') {
        role = 'model' as typeof role;
      } else if (!['user', 'model', 'function', 'system'].includes(role)) {
        throw new Error(
          `Invalid role "${role}". Valid roles: user, model, function, system.`,
        );
      }
      return { role, parts: [{ text: msg.content }] };
    });

    if (geminiMessages.length === 0) {
      throw new Error('No messages provided.');
    }

    const history = geminiMessages.slice(0, -1);
    const lastMessage = geminiMessages[geminiMessages.length - 1];

    try {
      const modelInstance = this.genAI.getGenerativeModel({ model });
      const chat = modelInstance.startChat({
        history,
        generationConfig: { maxOutputTokens: maxOutput },
      });

      const result = await chat.sendMessage(lastMessage.parts[0].text);
      return result.response.text();
    } catch (error) {
      throw new Error(`Gemini error: ${(error as Error).message}`);
    }
  }
}
