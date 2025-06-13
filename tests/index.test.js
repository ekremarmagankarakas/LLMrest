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

describe('createAIClient', () => {
  const mockApiKeys = {
    openai: 'test-openai-key',
    claude: 'test-claude-key',
    gemini: 'test-gemini-key',
    perplexity: 'test-perplexity-key'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    validateInputSize.mockImplementation(() => {})
    moderationCheck.mockResolvedValue(true)
  })

  describe('initialization', () => {
    it('should throw error if apiKeys not provided', () => {
      expect(() => createAIClient({})).toThrow('API keys are required.')
    })

    it('should throw error if apiKeys is not an object', () => {
      expect(() => createAIClient({ apiKeys: 'invalid' })).toThrow('API keys are required.')
    })

    it('should create client successfully with valid apiKeys', () => {
      const client = createAIClient({ apiKeys: mockApiKeys })
      expect(client).toHaveProperty('createChat')
      expect(client).toHaveProperty('createChatMessages')
    })
  })

  describe('createChat', () => {
    let client

    beforeEach(() => {
      client = createAIClient({ apiKeys: mockApiKeys })
    })

    it('should handle OpenAI models', async () => {
      const mockResponse = { content: 'test response' }
      openaiChat.mockResolvedValue(mockResponse)

      const result = await client.createChat({
        models: ['gpt-4'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500
      })

      expect(openaiChat).toHaveBeenCalledWith(mockApiKeys.openai, {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
        maxOutput: 500
      })
      expect(result).toEqual({ 'gpt-4': mockResponse })
    })

    it('should handle Claude models', async () => {
      const mockResponse = { content: 'test response' }
      claudeChat.mockResolvedValue(mockResponse)

      const result = await client.createChat({
        models: ['claude-3-sonnet-20240229'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500
      })

      expect(claudeChat).toHaveBeenCalledWith(mockApiKeys.claude, {
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'test' }],
        maxOutput: 500
      })
      expect(result).toEqual({ 'claude-3-sonnet-20240229': mockResponse })
    })

    it('should handle Gemini models', async () => {
      const mockResponse = { content: 'test response' }
      geminiChat.mockResolvedValue(mockResponse)

      const result = await client.createChat({
        models: ['gemini-1.5-pro'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500
      })

      expect(geminiChat).toHaveBeenCalledWith(mockApiKeys.gemini, {
        model: 'gemini-1.5-pro',
        messages: [{ role: 'user', content: 'test' }],
        maxOutput: 500
      })
      expect(result).toEqual({ 'gemini-1.5-pro': mockResponse })
    })

    it('should handle Perplexity models', async () => {
      const mockResponse = { content: 'test response' }
      perplexityChat.mockResolvedValue(mockResponse)

      const result = await client.createChat({
        models: ['llama-3.1-sonar-small-128k-online'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500
      })

      expect(perplexityChat).toHaveBeenCalledWith(mockApiKeys.perplexity, {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'test' }],
        maxOutput: 500
      })
      expect(result).toEqual({ 'llama-3.1-sonar-small-128k-online': mockResponse })
    })

    it('should handle unsupported models', async () => {
      const result = await client.createChat({
        models: ['unsupported-model'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500
      })

      expect(result).toEqual({
        'unsupported-model': { error: 'Unsupported model: unsupported-model' }
      })
    })

    it('should call validateInputSize', async () => {
      const messages = [{ role: 'user', content: 'test' }]
      await client.createChat({
        models: ['gpt-4'],
        messages,
        maxInput: 1000,
        maxOutput: 500
      })

      expect(validateInputSize).toHaveBeenCalledWith(messages, 1000)
    })

    it('should call moderationCheck when enabled', async () => {
      const messages = [{ role: 'user', content: 'test' }]
      await client.createChat({
        models: ['gpt-4'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        moderationEnabled: true
      })

      expect(moderationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages)
    })

    it('should not call moderationCheck when disabled', async () => {
      const messages = [{ role: 'user', content: 'test' }]
      await client.createChat({
        models: ['gpt-4'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        moderationEnabled: false
      })

      expect(moderationCheck).not.toHaveBeenCalled()
    })

    it('should handle mixed success and failure results', async () => {
      openaiChat.mockResolvedValue({ content: 'success' })
      claudeChat.mockRejectedValue(new Error('API error'))

      const result = await client.createChat({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages: [{ role: 'user', content: 'test' }],
        maxInput: 1000,
        maxOutput: 500
      })

      expect(result).toEqual({
        'gpt-4': { content: 'success' },
        'claude-3-sonnet-20240229': { error: 'API error' }
      })
    })
  })

  describe('createChatMessages', () => {
    let client

    beforeEach(() => {
      client = createAIClient({ apiKeys: mockApiKeys })
    })

    it('should throw error if messages is not an object', async () => {
      await expect(client.createChatMessages({
        models: ['gpt-4'],
        messages: 'invalid',
        maxInput: 1000,
        maxOutput: 500
      })).rejects.toThrow('Messages must be an object with model-specific messages.')
    })

    it('should throw error if no messages provided for a model', async () => {
      await expect(client.createChatMessages({
        models: ['gpt-4'],
        messages: {},
        maxInput: 1000,
        maxOutput: 500
      })).rejects.toThrow('No messages provided for model: gpt-4')
    })

    it('should handle model-specific messages', async () => {
      const mockResponse = { content: 'test response' }
      openaiChat.mockResolvedValue(mockResponse)

      const messages = {
        'gpt-4': [{ role: 'user', content: 'test for gpt-4' }]
      }

      const result = await client.createChatMessages({
        models: ['gpt-4'],
        messages,
        maxInput: 1000,
        maxOutput: 500
      })

      expect(openaiChat).toHaveBeenCalledWith(mockApiKeys.openai, {
        model: 'gpt-4',
        messages: messages['gpt-4'],
        maxOutput: 500
      })
      expect(result).toEqual({ 'gpt-4': mockResponse })
    })

    it('should validate input size for each model', async () => {
      const messages = {
        'gpt-4': [{ role: 'user', content: 'test for gpt-4' }],
        'claude-3-sonnet-20240229': [{ role: 'user', content: 'test for claude' }]
      }

      await client.createChatMessages({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages,
        maxInput: 1000,
        maxOutput: 500
      })

      expect(validateInputSize).toHaveBeenCalledWith(messages['gpt-4'], 1000)
      expect(validateInputSize).toHaveBeenCalledWith(messages['claude-3-sonnet-20240229'], 1000)
    })

    it('should perform moderation check for each model when enabled', async () => {
      const messages = {
        'gpt-4': [{ role: 'user', content: 'test for gpt-4' }],
        'claude-3-sonnet-20240229': [{ role: 'user', content: 'test for claude' }]
      }

      await client.createChatMessages({
        models: ['gpt-4', 'claude-3-sonnet-20240229'],
        messages,
        maxInput: 1000,
        maxOutput: 500,
        moderationEnabled: true
      })

      expect(moderationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages['gpt-4'])
      expect(moderationCheck).toHaveBeenCalledWith(mockApiKeys.openai, messages['claude-3-sonnet-20240229'])
    })
  })
})