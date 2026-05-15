import { PerplexityProvider } from '../../src/providers/perplexity';
import OpenAI from 'openai';

jest.mock('openai');

const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('PerplexityProvider', () => {
  const apiKey = 'test-key';
  const messages = [{ role: 'user' as const, content: 'Hello' }];

  let mockCreate: jest.Mock;
  let provider: PerplexityProvider;

  beforeEach(() => {
    mockCreate = jest.fn();
    MockOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI);
    provider = new PerplexityProvider(apiKey);
  });

  afterEach(() => jest.clearAllMocks());

  it('uses perplexity base URL', () => {
    expect(MockOpenAI).toHaveBeenCalledWith({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
  });

  it('returns content from first choice', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Perplexity response' } }],
    });
    const result = await provider.chat({ model: 'sonar', messages });
    expect(result).toBe('Perplexity response');
  });

  it('throws on empty choices', async () => {
    mockCreate.mockResolvedValue({ choices: [] });
    await expect(
      provider.chat({ model: 'sonar', messages }),
    ).rejects.toThrow(/Empty response from Perplexity API/);
  });

  it('wraps API errors', async () => {
    mockCreate.mockRejectedValue(new Error('connection error'));
    await expect(
      provider.chat({ model: 'sonar', messages }),
    ).rejects.toThrow(/Perplexity error: connection error/);
  });
});
