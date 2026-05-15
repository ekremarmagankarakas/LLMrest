import { moderationCheck } from '../../src/middleware/moderationCheck';
import OpenAI from 'openai';

jest.mock('openai');

const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('moderationCheck', () => {
  const apiKey = 'test-key';
  const messages = [
    { role: 'user' as const, content: 'Hello' },
    { role: 'assistant' as const, content: 'Hi there' },
  ];

  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockCreate = jest.fn();
    MockOpenAI.mockImplementation(() => ({
      moderations: { create: mockCreate },
    }) as unknown as OpenAI);
  });

  afterEach(() => jest.clearAllMocks());

  it('resolves when content is not flagged', async () => {
    mockCreate.mockResolvedValue({ results: [{ flagged: false }, { flagged: false }] });
    await expect(moderationCheck(apiKey, messages)).resolves.toBeUndefined();
    expect(mockCreate).toHaveBeenCalledWith({ input: ['Hello', 'Hi there'] });
  });

  it('throws when any content is flagged', async () => {
    mockCreate.mockResolvedValue({ results: [{ flagged: true }, { flagged: false }] });
    await expect(moderationCheck(apiKey, messages)).rejects.toThrow(
      'Input contains restricted or potentially harmful content.',
    );
  });

  it('instantiates OpenAI with the correct API key', async () => {
    mockCreate.mockResolvedValue({ results: [{ flagged: false }] });
    await moderationCheck(apiKey, [messages[0]]);
    expect(MockOpenAI).toHaveBeenCalledWith({ apiKey });
  });
});
