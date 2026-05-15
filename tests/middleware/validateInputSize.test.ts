import { validateInputSize } from '../../src/middleware/validateInputSize';
import type { Message } from '../../src/types';

const msg = (content: string): Message => ({ role: 'user', content });

describe('validateInputSize', () => {
  it('passes when no maxInput provided', () => {
    expect(() => validateInputSize([msg('hello'.repeat(1000))])).not.toThrow();
  });

  it('passes when input is within limit', () => {
    expect(() => validateInputSize([msg('hello')], 1000)).not.toThrow();
  });

  it('throws when input exceeds limit', () => {
    expect(() => validateInputSize([msg('a'.repeat(200))], 100)).toThrow(
      /Input size \(\d+ bytes\) exceeds the limit of 100 bytes/,
    );
  });

  it('counts bytes across multiple messages', () => {
    const messages = [msg('a'.repeat(60)), msg('b'.repeat(60))];
    expect(() => validateInputSize(messages, 100)).toThrow(/exceeds/);
  });

  it('passes when maxInput is 0 (treated as undefined)', () => {
    expect(() => validateInputSize([msg('hello'.repeat(1000))], 0)).not.toThrow();
  });
});
