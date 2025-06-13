const { transformMessages } = require('../../lib/middleware/transformMessages')

describe('transformMessages', () => {
  it('should throw error for invalid target', () => {
    const messages = [{ role: 'user', content: 'Hello' }]
    
    expect(() => transformMessages(messages, 'invalid')).toThrow(
      'Invalid target: invalid. Supported targets are "anthropic" and "gemini".'
    )
  })

  it('should pass through regular messages for anthropic', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ]
    
    const result = transformMessages(messages, 'anthropic')
    expect(result).toEqual(messages)
  })

  it('should pass through regular messages for gemini', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ]
    
    const result = transformMessages(messages, 'gemini')
    expect(result).toEqual(messages)
  })

  it('should transform system messages for anthropic', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' }
    ]
    
    const result = transformMessages(messages, 'anthropic')
    expect(result).toEqual([
      { role: 'user', content: 'You are a helpful assistant' },
      { role: 'assistant', content: 'Okay' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('should transform system messages for gemini', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' }
    ]
    
    const result = transformMessages(messages, 'gemini')
    expect(result).toEqual([
      { role: 'user', content: 'You are a helpful assistant' },
      { role: 'model', content: 'Okay' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('should handle multiple system messages', () => {
    const messages = [
      { role: 'system', content: 'First instruction' },
      { role: 'system', content: 'Second instruction' },
      { role: 'user', content: 'Hello' }
    ]
    
    const result = transformMessages(messages, 'anthropic')
    expect(result).toEqual([
      { role: 'user', content: 'First instruction' },
      { role: 'assistant', content: 'Okay' },
      { role: 'user', content: 'Second instruction' },
      { role: 'assistant', content: 'Okay' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('should handle mixed message types', () => {
    const messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'system', content: 'Be concise' },
      { role: 'user', content: 'How are you?' }
    ]
    
    const result = transformMessages(messages, 'anthropic')
    expect(result).toEqual([
      { role: 'user', content: 'You are helpful' },
      { role: 'assistant', content: 'Okay' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'Be concise' },
      { role: 'assistant', content: 'Okay' },
      { role: 'user', content: 'How are you?' }
    ])
  })

  it('should handle empty messages array', () => {
    const messages = []
    
    const result = transformMessages(messages, 'anthropic')
    expect(result).toEqual([])
  })
})