const { validateInputSize } = require('../../lib/middleware/validateInputSize')

describe('validateInputSize', () => {
  it('should not throw error when input size is within limit', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ]
    const maxInput = 1000

    expect(() => validateInputSize(messages, maxInput)).not.toThrow()
  })

  it('should throw error when input size exceeds limit', () => {
    const messages = [
      { role: 'user', content: 'a'.repeat(500) },
      { role: 'assistant', content: 'b'.repeat(600) }
    ]
    const maxInput = 1000

    expect(() => validateInputSize(messages, maxInput)).toThrow('Input size exceeds the limit of 0.9765625 KB.')
  })

  it('should handle empty messages array', () => {
    const messages = []
    const maxInput = 1000

    expect(() => validateInputSize(messages, maxInput)).not.toThrow()
  })

  it('should handle single message', () => {
    const messages = [
      { role: 'user', content: 'Single message' }
    ]
    const maxInput = 1000

    expect(() => validateInputSize(messages, maxInput)).not.toThrow()
  })

  it('should calculate size correctly for unicode characters', () => {
    const messages = [
      { role: 'user', content: '🚀 Hello World! 你好' }
    ]
    const maxInput = 50

    expect(() => validateInputSize(messages, maxInput)).not.toThrow()
  })

  it('should throw error for unicode characters exceeding limit', () => {
    const messages = [
      { role: 'user', content: '🚀'.repeat(100) }
    ]
    const maxInput = 100

    expect(() => validateInputSize(messages, maxInput)).toThrow()
  })
})