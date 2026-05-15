import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { BaseProvider } from './base';
import { transformMessages } from '../middleware/transformMessages';
import type { ProviderChatOptions } from '../types';

export class ClaudeProvider extends BaseProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async chat({ model, messages, maxOutput }: ProviderChatOptions): Promise<string> {
    const transformed = transformMessages(messages, 'anthropic') as MessageParam[];

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxOutput ?? 1024,
        messages: transformed,
      });

      const block = response.content?.[0];
      if (!block || block.type !== 'text') {
        throw new Error('Empty or non-text response from Claude API.');
      }

      return block.text;
    } catch (error) {
      throw new Error(`Claude error: ${(error as Error).message}`);
    }
  }
}
