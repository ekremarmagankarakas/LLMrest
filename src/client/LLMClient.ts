import { ModelRegistry } from '../registry/ModelRegistry';
import { OpenAIProvider } from '../providers/openai';
import { ClaudeProvider } from '../providers/claude';
import { GeminiProvider } from '../providers/gemini';
import { PerplexityProvider } from '../providers/perplexity';
import { validateInputSize } from '../middleware/validateInputSize';
import { moderationCheck } from '../middleware/moderationCheck';
import { OPENAI_MODELS, CLAUDE_MODELS, GEMINI_MODELS, PERPLEXITY_MODELS } from '../constants/models';
import type {
  LLMClientOptions,
  ApiKeys,
  Message,
  ChatParams,
  ChatMessagesParams,
  ChatStreamingParams,
  ChatResult,
  StreamingResponse,
} from '../types';

export class LLMClient {
  private readonly apiKeys: ApiKeys;
  private readonly registry: ModelRegistry;

  constructor({ apiKeys }: LLMClientOptions) {
    if (!apiKeys || typeof apiKeys !== 'object') {
      throw new Error('API keys are required.');
    }
    this.apiKeys = apiKeys;
    this.registry = this.buildRegistry();
  }

  private buildRegistry(): ModelRegistry {
    const registry = new ModelRegistry();
    const { openai, claude, gemini, perplexity } = this.apiKeys;

    if (openai) registry.registerMany(OPENAI_MODELS, new OpenAIProvider(openai));
    if (claude) registry.registerMany(CLAUDE_MODELS, new ClaudeProvider(claude));
    if (gemini) registry.registerMany(GEMINI_MODELS, new GeminiProvider(gemini));
    if (perplexity) registry.registerMany(PERPLEXITY_MODELS, new PerplexityProvider(perplexity));

    return registry;
  }

  private dispatch(model: string, messages: Message[], maxOutput?: number): Promise<string> {
    const provider = this.registry.getProvider(model);
    if (!provider) {
      return Promise.reject(new Error(`Unsupported model: ${model}`));
    }
    return provider.chat({ model, messages, maxOutput });
  }

  private aggregateResults(
    models: string[],
    results: PromiseSettledResult<string>[],
  ): ChatResult {
    return models.reduce<ChatResult>((acc, model, index) => {
      const result = results[index];
      acc[model] =
        result.status === 'fulfilled'
          ? result.value
          : { error: result.reason?.message ?? 'An unknown error occurred' };
      return acc;
    }, {});
  }

  private async runModeration(messages: Message[]): Promise<void> {
    if (!this.apiKeys.openai) {
      throw new Error('OpenAI API key required for moderation.');
    }
    await moderationCheck(this.apiKeys.openai, messages);
  }

  async createChat({ models, messages, maxInput, maxOutput, moderationEnabled }: ChatParams): Promise<ChatResult> {
    validateInputSize(messages, maxInput);

    if (moderationEnabled) await this.runModeration(messages);

    const results = await Promise.allSettled(
      models.map((model) => this.dispatch(model, messages, maxOutput)),
    );

    return this.aggregateResults(models, results);
  }

  async createChatMessages({
    models,
    messages,
    maxInput,
    maxOutput,
    moderationEnabled,
  }: ChatMessagesParams): Promise<ChatResult> {
    if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
      throw new Error('Messages must be an object with model-specific messages.');
    }

    await Promise.all(
      models.map(async (model) => {
        if (!messages[model]) {
          throw new Error(`No messages provided for model: ${model}`);
        }
        validateInputSize(messages[model], maxInput);
        if (moderationEnabled) await this.runModeration(messages[model]);
      }),
    );

    const results = await Promise.allSettled(
      models.map((model) => this.dispatch(model, messages[model], maxOutput)),
    );

    return this.aggregateResults(models, results);
  }

  async createChatStreaming({
    models,
    messages,
    maxInput,
    maxOutput,
    moderationEnabled,
    onResponse,
  }: ChatStreamingParams): Promise<void> {
    if (!onResponse || typeof onResponse !== 'function') {
      throw new Error('onResponse callback function is required for streaming.');
    }

    const isModelSpecific = !Array.isArray(messages) && typeof messages === 'object';

    if (isModelSpecific) {
      const msgMap = messages as Record<string, Message[]>;

      await Promise.all(
        models.map(async (model) => {
          if (!msgMap[model]) {
            throw new Error(`No messages provided for model: ${model}`);
          }
          validateInputSize(msgMap[model], maxInput);
          if (moderationEnabled) await this.runModeration(msgMap[model]);
        }),
      );

      await Promise.allSettled(
        models.map(async (model) => {
          const response = await this.buildStreamResponse(model, msgMap[model], maxOutput);
          onResponse(response);
        }),
      );
    } else {
      const msgArray = messages as Message[];

      validateInputSize(msgArray, maxInput);
      if (moderationEnabled) await this.runModeration(msgArray);

      await Promise.allSettled(
        models.map(async (model) => {
          const response = await this.buildStreamResponse(model, msgArray, maxOutput);
          onResponse(response);
        }),
      );
    }
  }

  private async buildStreamResponse(
    model: string,
    messages: Message[],
    maxOutput?: number,
  ): Promise<StreamingResponse> {
    try {
      const data = await this.dispatch(model, messages, maxOutput);
      return { model, status: 'success', data, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        model,
        status: 'error',
        error: (error as Error).message ?? 'An unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
