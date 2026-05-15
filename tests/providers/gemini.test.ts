import { GeminiProvider } from '../../src/providers/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');

const MockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('GeminiProvider', () => {
  const apiKey = 'test-key';
  const messages = [{ role: 'user' as const, content: 'Hello' }];

  let mockSendMessage: jest.Mock;
  let mockStartChat: jest.Mock;
  let mockGetGenerativeModel: jest.Mock;
  let provider: GeminiProvider;

  beforeEach(() => {
    mockSendMessage = jest.fn().mockResolvedValue({
      response: { text: () => 'Gemini response' },
    });
    mockStartChat = jest.fn().mockReturnValue({ sendMessage: mockSendMessage });
    mockGetGenerativeModel = jest.fn().mockReturnValue({ startChat: mockStartChat });

    MockGoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }) as unknown as GoogleGenerativeAI);

    provider = new GeminiProvider(apiKey);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns text from response', async () => {
    const result = await provider.chat({ model: 'gemini-1.5-pro', messages });
    expect(result).toBe('Gemini response');
  });

  it('sends last message via sendMessage, not in history', async () => {
    const multiMessages = [
      { role: 'user' as const, content: 'First' },
      { role: 'assistant' as const, content: 'Second' },
      { role: 'user' as const, content: 'Last' },
    ];
    await provider.chat({ model: 'gemini-1.5-pro', messages: multiMessages });

    const historyArg = mockStartChat.mock.calls[0][0].history;
    expect(historyArg).toHaveLength(2);
    expect(mockSendMessage).toHaveBeenCalledWith('Last');
  });

  it('sends single message with empty history', async () => {
    await provider.chat({ model: 'gemini-1.5-pro', messages });
    expect(mockStartChat.mock.calls[0][0].history).toHaveLength(0);
    expect(mockSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('throws on empty messages array', async () => {
    await expect(provider.chat({ model: 'gemini-1.5-pro', messages: [] })).rejects.toThrow(
      /No messages provided/,
    );
  });

  it('wraps API errors', async () => {
    mockSendMessage.mockRejectedValue(new Error('quota exceeded'));
    await expect(provider.chat({ model: 'gemini-1.5-pro', messages })).rejects.toThrow(
      /Gemini error: quota exceeded/,
    );
  });
});
