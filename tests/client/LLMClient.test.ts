import { LLMClient } from '../../src/client/LLMClient';

jest.mock('../../src/providers/openai');
jest.mock('../../src/providers/claude');
jest.mock('../../src/providers/gemini');
jest.mock('../../src/providers/perplexity');
jest.mock('../../src/middleware/moderationCheck');
jest.mock('../../src/middleware/validateInputSize');

import { OpenAIProvider } from '../../src/providers/openai';
import { ClaudeProvider } from '../../src/providers/claude';
import { GeminiProvider } from '../../src/providers/gemini';
import { PerplexityProvider } from '../../src/providers/perplexity';
import { moderationCheck } from '../../src/middleware/moderationCheck';
import { validateInputSize } from '../../src/middleware/validateInputSize';

const MockOpenAIProvider = OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>;
const MockClaudeProvider = ClaudeProvider as jest.MockedClass<typeof ClaudeProvider>;
const MockGeminiProvider = GeminiProvider as jest.MockedClass<typeof GeminiProvider>;
const MockPerplexityProvider = PerplexityProvider as jest.MockedClass<typeof PerplexityProvider>;
const mockModerationCheck = moderationCheck as jest.MockedFunction<typeof moderationCheck>;
const mockValidateInputSize = validateInputSize as jest.MockedFunction<typeof validateInputSize>;

const mockApiKeys = {
  openai: 'test-openai-key',
  claude: 'test-claude-key',
  gemini: 'test-gemini-key',
  perplexity: 'test-perplexity-key',
};

const messages = [{ role: 'user' as const, content: 'Hello' }];

describe('LLMClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateInputSize.mockImplementation(() => undefined);
    mockModerationCheck.mockResolvedValue(undefined);

    MockOpenAIProvider.prototype.chat = jest.fn().mockResolvedValue('OpenAI response');
    MockClaudeProvider.prototype.chat = jest.fn().mockResolvedValue('Claude response');
    MockGeminiProvider.prototype.chat = jest.fn().mockResolvedValue('Gemini response');
    MockPerplexityProvider.prototype.chat = jest.fn().mockResolvedValue('Perplexity response');
  });

  describe('constructor', () => {
    it('throws when apiKeys is missing', () => {
      expect(() => new LLMClient({ apiKeys: null as never })).toThrow('API keys are required.');
    });

    it('throws when apiKeys is not an object', () => {
      expect(() => new LLMClient({ apiKeys: 'bad' as never })).toThrow('API keys are required.');
    });

    it('creates client with valid apiKeys', () => {
      expect(() => new LLMClient({ apiKeys: mockApiKeys })).not.toThrow();
    });
  });

  describe('createChat', () => {
    let client: LLMClient;

    beforeEach(() => {
      client = new LLMClient({ apiKeys: mockApiKeys });
    });

    it('calls validateInputSize with messages and maxInput', async () => {
      await client.createChat({ models: ['gpt-4o'], messages, maxInput: 1000, maxOutput: 500 });
      expect(mockValidateInputSize).toHaveBeenCalledWith(messages, 1000);
    });

    it('calls moderationCheck when enabled', async () => {
      await client.createChat({ models: ['gpt-4o'], messages, moderationEnabled: true });
      expect(mockModerationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages);
    });

    it('skips moderationCheck when disabled', async () => {
      await client.createChat({ models: ['gpt-4o'], messages, moderationEnabled: false });
      expect(mockModerationCheck).not.toHaveBeenCalled();
    });

    it('returns success result for OpenAI model', async () => {
      const result = await client.createChat({ models: ['gpt-4o'], messages });
      expect(result).toEqual({ 'gpt-4o': 'OpenAI response' });
    });

    it('returns success result for Claude model', async () => {
      const result = await client.createChat({ models: ['claude-sonnet-4-6'], messages });
      expect(result).toEqual({ 'claude-sonnet-4-6': 'Claude response' });
    });

    it('returns success result for Gemini model', async () => {
      const result = await client.createChat({ models: ['gemini-2.5-pro'], messages });
      expect(result).toEqual({ 'gemini-2.5-pro': 'Gemini response' });
    });

    it('returns success result for Perplexity model', async () => {
      const result = await client.createChat({
        models: ['sonar'],
        messages,
      });
      expect(result).toEqual({ 'sonar': 'Perplexity response' });
    });

    it('returns error object for unsupported model', async () => {
      const result = await client.createChat({ models: ['unknown-model'], messages });
      expect(result).toEqual({ 'unknown-model': { error: 'Unsupported model: unknown-model' } });
    });

    it('handles mixed success and failure', async () => {
      MockClaudeProvider.prototype.chat = jest.fn().mockRejectedValue(new Error('API error'));
      const freshClient = new LLMClient({ apiKeys: mockApiKeys });
      const result = await freshClient.createChat({
        models: ['gpt-4o', 'claude-sonnet-4-6'],
        messages,
      });
      expect(result['gpt-4o']).toBe('OpenAI response');
      expect(result['claude-sonnet-4-6']).toEqual({ error: 'API error' });
    });
  });

  describe('createChatMessages', () => {
    let client: LLMClient;

    beforeEach(() => {
      client = new LLMClient({ apiKeys: mockApiKeys });
    });

    it('throws when messages is not an object', async () => {
      await expect(
        client.createChatMessages({ models: ['gpt-4o'], messages: 'bad' as never }),
      ).rejects.toThrow('Messages must be an object with model-specific messages.');
    });

    it('throws when messages is an array', async () => {
      await expect(
        client.createChatMessages({ models: ['gpt-4o'], messages: [] as never }),
      ).rejects.toThrow('Messages must be an object with model-specific messages.');
    });

    it('throws when model has no messages', async () => {
      await expect(
        client.createChatMessages({ models: ['gpt-4o'], messages: {} }),
      ).rejects.toThrow('No messages provided for model: gpt-4');
    });

    it('returns per-model results', async () => {
      const result = await client.createChatMessages({
        models: ['gpt-4o'],
        messages: { 'gpt-4o': messages },
      });
      expect(result).toEqual({ 'gpt-4o': 'OpenAI response' });
    });

    it('validates input size per model', async () => {
      const modelMessages = {
        'gpt-4o': messages,
        'claude-sonnet-4-6': [{ role: 'user' as const, content: 'Hi claude' }],
      };
      await client.createChatMessages({
        models: ['gpt-4o', 'claude-sonnet-4-6'],
        messages: modelMessages,
        maxInput: 1000,
      });
      expect(mockValidateInputSize).toHaveBeenCalledWith(modelMessages['gpt-4o'], 1000);
      expect(mockValidateInputSize).toHaveBeenCalledWith(
        modelMessages['claude-sonnet-4-6'],
        1000,
      );
    });

    it('runs moderation per model when enabled', async () => {
      const modelMessages = {
        'gpt-4o': messages,
        'claude-sonnet-4-6': [{ role: 'user' as const, content: 'Hi claude' }],
      };
      await client.createChatMessages({
        models: ['gpt-4o', 'claude-sonnet-4-6'],
        messages: modelMessages,
        moderationEnabled: true,
      });
      expect(mockModerationCheck).toHaveBeenCalledWith(mockApiKeys.openai, modelMessages['gpt-4o']);
      expect(mockModerationCheck).toHaveBeenCalledWith(
        mockApiKeys.openai,
        modelMessages['claude-sonnet-4-6'],
      );
    });
  });

  describe('createChatStreaming', () => {
    let client: LLMClient;

    beforeEach(() => {
      client = new LLMClient({ apiKeys: mockApiKeys });
    });

    it('throws when onResponse not provided', async () => {
      await expect(
        client.createChatStreaming({ models: ['gpt-4o'], messages, onResponse: undefined as never }),
      ).rejects.toThrow('onResponse callback function is required for streaming.');
    });

    it('throws when onResponse is not a function', async () => {
      await expect(
        client.createChatStreaming({ models: ['gpt-4o'], messages, onResponse: 'bad' as never }),
      ).rejects.toThrow('onResponse callback function is required for streaming.');
    });

    it('streams success responses for array messages', async () => {
      const onResponse = jest.fn();
      await client.createChatStreaming({ models: ['gpt-4o'], messages, onResponse });
      expect(onResponse).toHaveBeenCalledWith({
        model: 'gpt-4o',
        status: 'success',
        data: 'OpenAI response',
        timestamp: expect.any(String),
      });
    });

    it('streams error response for failed model', async () => {
      MockOpenAIProvider.prototype.chat = jest.fn().mockRejectedValue(new Error('failure'));
      const freshClient = new LLMClient({ apiKeys: mockApiKeys });
      const onResponse = jest.fn();
      await freshClient.createChatStreaming({ models: ['gpt-4o'], messages, onResponse });
      expect(onResponse).toHaveBeenCalledWith({
        model: 'gpt-4o',
        status: 'error',
        error: expect.stringContaining('failure'),
        timestamp: expect.any(String),
      });
    });

    it('streams error for unsupported model', async () => {
      const onResponse = jest.fn();
      await client.createChatStreaming({
        models: ['unknown-model'],
        messages,
        onResponse,
      });
      expect(onResponse).toHaveBeenCalledWith({
        model: 'unknown-model',
        status: 'error',
        error: 'Unsupported model: unknown-model',
        timestamp: expect.any(String),
      });
    });

    it('streams responses for model-specific messages', async () => {
      const onResponse = jest.fn();
      const modelMessages = {
        'gpt-4o': messages,
        'claude-sonnet-4-6': [{ role: 'user' as const, content: 'Hi' }],
      };
      await client.createChatStreaming({
        models: ['gpt-4o', 'claude-sonnet-4-6'],
        messages: modelMessages,
        onResponse,
      });
      expect(onResponse).toHaveBeenCalledTimes(2);
      const calls = onResponse.mock.calls.map((c) => c[0]);
      expect(calls.find((r) => r.model === 'gpt-4o')?.status).toBe('success');
      expect(calls.find((r) => r.model === 'claude-sonnet-4-6')?.status).toBe('success');
    });

    it('throws when model-specific message is missing', async () => {
      const onResponse = jest.fn();
      await expect(
        client.createChatStreaming({
          models: ['gpt-4o', 'claude-sonnet-4-6'],
          messages: { 'gpt-4o': messages },
          onResponse,
        }),
      ).rejects.toThrow('No messages provided for model: claude-sonnet-4-6');
    });

    it('runs moderation for array messages when enabled', async () => {
      const onResponse = jest.fn();
      await client.createChatStreaming({ models: ['gpt-4o'], messages, moderationEnabled: true, onResponse });
      expect(mockModerationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages);
    });

    it('validates input size for array messages', async () => {
      const onResponse = jest.fn();
      await client.createChatStreaming({ models: ['gpt-4o'], messages, maxInput: 500, onResponse });
      expect(mockValidateInputSize).toHaveBeenCalledWith(messages, 500);
    });
  });
});
