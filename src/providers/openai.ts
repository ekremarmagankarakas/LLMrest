import OpenAI from 'openai';
import { BaseProvider } from './base';
import type { ProviderChatOptions } from '../types';

export class OpenAIProvider extends BaseProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  async chat({ model, messages, maxOutput }: ProviderChatOptions): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxOutput,
      });

      const choice = response.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('Empty response from OpenAI API.');
      }

      return choice.message.content;
    } catch (error) {
      throw new Error(`OpenAI error: ${(error as Error).message}`);
    }
  }
}
