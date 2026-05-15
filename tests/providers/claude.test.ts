import { ClaudeProvider } from '../../src/providers/claude';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const MockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('ClaudeProvider', () => {
  const apiKey = 'test-key';
  const messages = [{ role: 'user' as const, content: 'Hello' }];

  let mockCreate: jest.Mock;
  let provider: ClaudeProvider;

  beforeEach(() => {
    mockCreate = jest.fn();
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic);
    provider = new ClaudeProvider(apiKey);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns text from first content block', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello back' }],
    });
    const result = await provider.chat({ model: 'claude-3-sonnet-20240229', messages });
    expect(result).toBe('Hello back');
  });

  it('uses default maxOutput of 1024 when not provided', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    await provider.chat({ model: 'claude-3-sonnet-20240229', messages });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 1024 }),
    );
  });

  it('throws on empty content array', async () => {
    mockCreate.mockResolvedValue({ content: [] });
    await expect(
      provider.chat({ model: 'claude-3-sonnet-20240229', messages }),
    ).rejects.toThrow(/Empty or non-text response from Claude API/);
  });

  it('wraps API errors', async () => {
    mockCreate.mockRejectedValue(new Error('overloaded'));
    await expect(
      provider.chat({ model: 'claude-3-sonnet-20240229', messages }),
    ).rejects.toThrow(/Claude error: overloaded/);
  });
});
