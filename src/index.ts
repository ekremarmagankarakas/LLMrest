export { LLMClient } from './client/LLMClient';
export { ModelRegistry } from './registry/ModelRegistry';
export { BaseProvider } from './providers/base';
export { OpenAIProvider } from './providers/openai';
export { ClaudeProvider } from './providers/claude';
export { GeminiProvider } from './providers/gemini';
export { PerplexityProvider } from './providers/perplexity';
export { OPENAI_MODELS, CLAUDE_MODELS, GEMINI_MODELS, PERPLEXITY_MODELS } from './constants/models';
export type {
  Message,
  MessageRole,
  ApiKeys,
  LLMClientOptions,
  ChatParams,
  ChatMessagesParams,
  ChatStreamingParams,
  ChatResult,
  StreamingResponse,
  ProviderChatOptions,
} from './types';

import { LLMClient } from './client/LLMClient';
import type { LLMClientOptions } from './types';

export const createAIClient = (options: LLMClientOptions): LLMClient => new LLMClient(options);
