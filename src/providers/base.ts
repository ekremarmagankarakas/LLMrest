import type { ProviderChatOptions } from '../types';

export abstract class BaseProvider {
  abstract chat(options: ProviderChatOptions): Promise<string>;
}
