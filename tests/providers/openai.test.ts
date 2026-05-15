import { OpenAIProvider } from '../../src/providers/openai';
import OpenAI from 'openai';

jest.mock('openai');

const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('OpenAIProvider', () => {
  const apiKey = 'test-key';
  const messages = [{ role: 'user' as const, content: 'Hello' }];

  let mockCreate: jest.Mock;
  let provider: OpenAIProvider;

  beforeEach(() => {
    mockCreate = jest.fn();
    MockOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI);
    provider = new OpenAIProvider(apiKey);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns content from first choice', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello back' } }],
    });
    const result = await provider.chat({ model: 'gpt-4', messages });
    expect(result).toBe('Hello back');
  });

  it('passes model, messages, and maxOutput to API', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });
    await provider.chat({ model: 'gpt-4o', messages, maxOutput: 500 });
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o',
      messages,
      max_tokens: 500,
    });
  });

  it('throws on empty choices array', async () => {
    mockCreate.mockResolvedValue({ choices: [] });
    await expect(provider.chat({ model: 'gpt-4', messages })).rejects.toThrow(
      /Empty response from OpenAI API/,
    );
  });

  it('wraps API errors', async () => {
    mockCreate.mockRejectedValue(new Error('rate limit'));
    await expect(provider.chat({ model: 'gpt-4', messages })).rejects.toThrow(
      /OpenAI error: rate limit/,
    );
  });
});
