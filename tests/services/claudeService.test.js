const { createChat } = require('../../lib/services/claudeService')
const { transformMessages } = require('../../lib/middleware/transformMessages')
const Anthropic = require('@anthropic-ai/sdk')

jest.mock('@anthropic-ai/sdk')
jest.mock('../../lib/middleware/transformMessages')

describe('claudeService', () => {
  let mockAnthropic
  let mockMessages

  beforeEach(() => {
    mockMessages = {
      create: jest.fn()
    }
    mockAnthropic = {
      messages: mockMessages
    }
    Anthropic.mockImplementation(() => mockAnthropic)
    transformMessages.mockImplementation((messages) => messages)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createChat', () => {
    it('should create chat completion successfully', async () => {
      const apiKey = 'test-api-key'
      const model = 'claude-3-sonnet-20240229'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      const transformedMessages = [{ role: 'user', content: 'Hello' }]
      transformMessages.mockReturnValue(transformedMessages)

      const mockResponse = {
        content: [{
          text: 'Hello! How can I assist you today?'
        }]
      }

      mockMessages.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(Anthropic).toHaveBeenCalledWith({ apiKey })
      expect(transformMessages).toHaveBeenCalledWith(messages, 'anthropic')
      expect(mockMessages.create).toHaveBeenCalledWith({
        model,
        max_tokens: maxOutput,
        messages: transformedMessages
      })
      expect(result).toBe('Hello! How can I assist you today?')
    })

    it('should handle API errors gracefully', async () => {
      const apiKey = 'test-api-key'
      const model = 'claude-3-sonnet-20240229'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      transformMessages.mockReturnValue(messages)
      mockMessages.create.mockRejectedValue(new Error('API quota exceeded'))

      await expect(createChat(apiKey, { model, messages, maxOutput }))
        .rejects.toThrow('Error processing request with Claude: API quota exceeded')

      expect(Anthropic).toHaveBeenCalledWith({ apiKey })
      expect(transformMessages).toHaveBeenCalledWith(messages, 'anthropic')
    })

    it('should transform messages correctly', async () => {
      const apiKey = 'test-api-key'
      const model = 'claude-3-haiku-20240307'
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ]
      const maxOutput = 50

      const transformedMessages = [
        { role: 'user', content: 'You are helpful' },
        { role: 'assistant', content: 'Okay' },
        { role: 'user', content: 'Hello' }
      ]
      transformMessages.mockReturnValue(transformedMessages)

      const mockResponse = {
        content: [{
          text: 'Hi there!'
        }]
      }

      mockMessages.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(transformMessages).toHaveBeenCalledWith(messages, 'anthropic')
      expect(mockMessages.create).toHaveBeenCalledWith({
        model,
        max_tokens: maxOutput,
        messages: transformedMessages
      })
      expect(result).toBe('Hi there!')
    })

    it('should handle different models', async () => {
      const apiKey = 'test-api-key'
      const model = 'claude-3-haiku-20240307'
      const messages = [{ role: 'user', content: 'Test' }]
      const maxOutput = 25

      transformMessages.mockReturnValue(messages)

      const mockResponse = {
        content: [{
          text: 'Test response'
        }]
      }

      mockMessages.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(mockMessages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 25,
        messages
      })
      expect(result).toBe('Test response')
    })

    it('should handle empty response text', async () => {
      const apiKey = 'test-api-key'
      const model = 'claude-3-sonnet-20240229'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      transformMessages.mockReturnValue(messages)

      const mockResponse = {
        content: [{
          text: ''
        }]
      }

      mockMessages.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(result).toBe('')
    })
  })
})