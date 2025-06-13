const { createChat } = require('../../lib/services/openaiService')
const OpenAI = require('openai')

jest.mock('openai')

describe('openaiService', () => {
  let mockOpenAI
  let mockChatCompletions

  beforeEach(() => {
    mockChatCompletions = {
      create: jest.fn()
    }
    mockOpenAI = {
      chat: {
        completions: mockChatCompletions
      }
    }
    OpenAI.mockImplementation(() => mockOpenAI)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createChat', () => {
    it('should create chat completion successfully', async () => {
      const apiKey = 'test-api-key'
    const model = 'gpt-4'
    const messages = [{ role: 'user', content: 'Hello' }]
    const maxOutput = 100

    const mockResponse = {
      choices: [{
        message: {
          content: 'Hello! How can I help you today?'
        }
      }]
    }

    mockChatCompletions.create.mockResolvedValue(mockResponse)

    const result = await createChat(apiKey, { model, messages, maxOutput })

    expect(OpenAI).toHaveBeenCalledWith({ apiKey })
    expect(mockChatCompletions.create).toHaveBeenCalledWith({
      model,
      messages,
      max_tokens: maxOutput
    })
    expect(result).toBe('Hello! How can I help you today?')
    })

    it('should handle API errors gracefully', async () => {
      const apiKey = 'test-api-key'
      const model = 'gpt-4'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      mockChatCompletions.create.mockRejectedValue(new Error('API rate limit exceeded'))

      await expect(createChat(apiKey, { model, messages, maxOutput }))
        .rejects.toThrow('Error processing request: API rate limit exceeded')

      expect(OpenAI).toHaveBeenCalledWith({ apiKey })
      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model,
        messages,
        max_tokens: maxOutput
      })
    })

    it('should handle different models', async () => {
      const apiKey = 'test-api-key'
      const model = 'gpt-3.5-turbo'
      const messages = [{ role: 'user', content: 'Test' }]
      const maxOutput = 50

      const mockResponse = {
        choices: [{
          message: {
            content: 'Test response'
          }
        }]
      }

      mockChatCompletions.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 50
      })
      expect(result).toBe('Test response')
    })

    it('should handle multiple messages', async () => {
      const apiKey = 'test-api-key'
      const model = 'gpt-4'
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ]
      const maxOutput = 100

      const mockResponse = {
        choices: [{
          message: {
            content: 'I am doing well, thank you!'
          }
        }]
      }

      mockChatCompletions.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model,
        messages,
        max_tokens: maxOutput
      })
      expect(result).toBe('I am doing well, thank you!')
    })

    it('should handle empty response gracefully', async () => {
      const apiKey = 'test-api-key'
      const model = 'gpt-4'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      const mockResponse = {
        choices: [{
          message: {
            content: ''
          }
        }]
      }

      mockChatCompletions.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(result).toBe('')
    })

    it('should handle null response content', async () => {
      const apiKey = 'test-api-key'
      const model = 'gpt-4'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      }

      mockChatCompletions.create.mockResolvedValue(mockResponse)

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(result).toBe(null)
    })
  })
})