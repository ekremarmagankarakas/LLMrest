import { transformMessages } from '../../src/middleware/transformMessages';
import type { Message } from '../../src/types';

describe('transformMessages', () => {
  it('passes non-system messages through unchanged', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ];
    expect(transformMessages(messages, 'anthropic')).toEqual(messages);
  });

  it('converts system messages for anthropic target', () => {
    const messages: Message[] = [{ role: 'system', content: 'You are helpful.' }];
    const result = transformMessages(messages, 'anthropic');
    expect(result).toEqual([
      { role: 'user', content: 'You are helpful.' },
      { role: 'assistant', content: 'Okay' },
    ]);
  });

  it('converts system messages for gemini target', () => {
    const messages: Message[] = [{ role: 'system', content: 'You are helpful.' }];
    const result = transformMessages(messages, 'gemini');
    expect(result).toEqual([
      { role: 'user', content: 'You are helpful.' },
      { role: 'assistant', content: 'Okay' },
    ]);
  });

  it('handles mixed system and non-system messages', () => {
    const messages: Message[] = [
      { role: 'system', content: 'Be concise.' },
      { role: 'user', content: 'What is 2+2?' },
    ];
    const result = transformMessages(messages, 'anthropic');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ role: 'user', content: 'Be concise.' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'Okay' });
    expect(result[2]).toEqual({ role: 'user', content: 'What is 2+2?' });
  });

  it('returns empty array for empty input', () => {
    expect(transformMessages([], 'anthropic')).toEqual([]);
  });
});
