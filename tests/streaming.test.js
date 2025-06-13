const { createAIClient } = require('../index')

jest.mock('../lib/services/openaiService')
jest.mock('../lib/services/claudeService')
jest.mock('../lib/services/geminiService')
jest.mock('../lib/services/perplexityService')
jest.mock('../lib/middleware/moderationCheck')
jest.mock('../lib/middleware/validateInputSize')

const { createChat: openaiChat } = require('../lib/services/openaiService')
const { createChat: claudeChat } = require('../lib/services/claudeService')
const { createChat: geminiChat } = require('../lib/services/geminiService')
const { createChat: perplexityChat } = require('../lib/services/perplexityService')
const { moderationCheck } = require('../lib/middleware/moderationCheck')
const { validateInputSize } = require('../lib/middleware/validateInputSize')

describe('createChatStreaming', () => {
  const mockApiKeys = {
    openai: 'test-openai-key',
    claude: 'test-claude-key',
    gemini: 'test-gemini-key',
    perplexity: 'test-perplexity-key'
  }

  let client

  beforeEach(() => {
    jest.clearAllMocks()
    validateInputSize.mockImplementation(() => {})
    moderationCheck.mockResolvedValue(true)
    client = createAIClient({ apiKeys: mockApiKeys })
  })

  describe('validation', () => {
    it('should throw error if onResponse callback is not provided', async () => {
      await expect(client.createChatStreaming({
        models: ['gpt-4'],
        messages: [{ role: 'user', content: 'test' }]
      })).rejects.toThrow('onResponse callback function is required for streaming.')
    })

    it('should throw error if onResponse is not a function', async () => {
      await expect(client.createChatStreaming({
        models: ['gpt-4'],
        messages: [{ role: 'user', content: 'test' }],
        onResponse: 'not-a-function'
      })).rejects.toThrow('onResponse callback function is required for streaming.')
    })
  })

  describe('streaming with same messages', () => {
    it('should stream responses for multiple models', async () => {
      const onResponse = jest.fn()
      openaiChat.mockResolvedValue('OpenAI response')
      claudeChat.mockResolvedValue('Claude response')

      await client.createChatStreaming({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500,
        onResponse
      })

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(validateInputSize).toHaveBeenCalledWith([{ role: 'user', content: 'test' }], 1000)
      expect(onResponse).toHaveBeenCalledTimes(2)
      
      // Check that responses were streamed
      const calls = onResponse.mock.calls
      expect(calls.some(call => call[0].model === 'gpt-4' && call[0].status === 'success')).toBe(true)
      expect(calls.some(call => call[0].model === 'claude-3-sonnet-20240229' && call[0].status === 'success')).toBe(true)
    })

    it('should handle errors in streaming', async () => {
      const onResponse = jest.fn()
      openaiChat.mockResolvedValue('OpenAI response')
      claudeChat.mockRejectedValue(new Error('Claude API error'))

      await client.createChatStreaming({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500,
        onResponse
      })

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onResponse).toHaveBeenCalledTimes(2)
      
      const calls = onResponse.mock.calls
      expect(calls.some(call => call[0].model === 'gpt-4' && call[0].status === 'success')).toBe(true)
      expect(calls.some(call => call[0].model === 'claude-3-sonnet-20240229' && call[0].status === 'error')).toBe(true)
    })

    it('should call moderation check when enabled', async () => {
      const onResponse = jest.fn()
      const messages = [{ role: 'user', content: 'test' }]

      await client.createChatStreaming({
        models: ['gpt-4'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        moderationEnabled: true,
        onResponse
      })

      expect(moderationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages)
    })
  })

  describe('streaming with model-specific messages', () => {
    it('should stream responses for model-specific messages', async () => {
      const onResponse = jest.fn()
      openaiChat.mockResolvedValue('OpenAI response')
      claudeChat.mockResolvedValue('Claude response')

      const messages = {
        'gpt-4': [{ role: 'user', content: 'OpenAI question' }],
        'claude-3-sonnet-20240229': [{ role: 'user', content: 'Claude question' }]
      }

      await client.createChatStreaming({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        onResponse
      })

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(validateInputSize).toHaveBeenCalledWith(messages['gpt-4'], 1000)
      expect(validateInputSize).toHaveBeenCalledWith(messages['claude-3-sonnet-20240229'], 1000)
      expect(onResponse).toHaveBeenCalledTimes(2)
    })

    it('should throw error if no messages provided for a model', async () => {
      const onResponse = jest.fn()
      const messages = {
        'gpt-4': [{ role: 'user', content: 'OpenAI question' }]
        // Missing claude messages
      }

      await expect(client.createChatStreaming({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        onResponse
      })).rejects.toThrow('No messages provided for model: claude-3-sonnet-20240229')
    })

    it('should validate each model messages separately', async () => {
      const onResponse = jest.fn()
      const messages = {
        'gpt-4': [{ role: 'user', content: 'OpenAI question' }],
        'claude-3-sonnet-20240229': [{ role: 'user', content: 'Claude question' }]
      }

      await client.createChatStreaming({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        moderationEnabled: true,
        onResponse
      })

      expect(moderationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages['gpt-4'])
      expect(moderationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages['claude-3-sonnet-20240229'])
    })
  })

  describe('response format', () => {
    it('should include correct response format for success', async () => {
      const onResponse = jest.fn()
      openaiChat.mockResolvedValue('Test response')

      await client.createChatStreaming({
        models: ['gpt-4'],
        messages: [{ role: 'user', content: 'test' }],
        onResponse
      })

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onResponse).toHaveBeenCalledWith({
        model: 'gpt-4',
        status: 'success',
        data: 'Test response',
        timestamp: expect.any(String)
      })
    })

    it('should include correct response format for error', async () => {
      const onResponse = jest.fn()
      openaiChat.mockRejectedValue(new Error('API Error'))

      await client.createChatStreaming({
        models: ['gpt-4'],
        messages: [{ role: 'user', content: 'test' }],
        onResponse
      })

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onResponse).toHaveBeenCalledWith({
        model: 'gpt-4',
        status: 'error',
        error: 'API Error',
        timestamp: expect.any(String)
      })
    })
  })

  describe('unsupported models', () => {
    it('should stream error for unsupported models', async () => {
      const onResponse = jest.fn()

      await client.createChatStreaming({
        models: ['unsupported-model'],
        messages: [{ role: 'user', content: 'test' }],
        onResponse
      })

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onResponse).toHaveBeenCalledWith({
        model: 'unsupported-model',
        status: 'error',
        error: 'Unsupported model: unsupported-model',
        timestamp: expect.any(String)
      })
    })
  })
})