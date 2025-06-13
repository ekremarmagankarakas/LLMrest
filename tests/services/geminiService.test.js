const { createChat } = require('../../lib/services/geminiService')
const { transformMessages } = require('../../lib/middleware/transformMessages')
const { GoogleGenerativeAI } = require('@google/generative-ai')

jest.mock('@google/generative-ai')
jest.mock('../../lib/middleware/transformMessages')

describe('geminiService', () => {
  let mockGenAI
  let mockModelInstance
  let mockChat
  let mockResponse

  beforeEach(() => {
    mockResponse = {
      text: jest.fn()
    }

    mockChat = {
      sendMessage: jest.fn().mockResolvedValue({
        response: mockResponse
      })
    }

    mockModelInstance = {
      startChat: jest.fn().mockReturnValue(mockChat)
    }

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModelInstance)
    }

    GoogleGenerativeAI.mockImplementation(() => mockGenAI)
    transformMessages.mockImplementation((messages) => messages)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createChat', () => {
    it('should create chat completion successfully', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-1.5-pro'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      const transformedMessages = [{ role: 'user', content: 'Hello' }]
      transformMessages.mockReturnValue(transformedMessages)
      mockResponse.text.mockReturnValue('Hello! How can I help you?')

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(GoogleGenerativeAI).toHaveBeenCalledWith(apiKey)
      expect(transformMessages).toHaveBeenCalledWith(messages, 'gemini')
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model })
      expect(mockModelInstance.startChat).toHaveBeenCalledWith({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }]
          }
        ],
        generationConfig: { max_output_tokens: maxOutput }
      })
      expect(mockChat.sendMessage).toHaveBeenCalledWith('Hello')
      expect(result).toBe('Hello! How can I help you?')
    })

    it('should transform assistant role to model role', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-1.5-flash'
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ]
      const maxOutput = 50

      transformMessages.mockReturnValue(messages)
      mockResponse.text.mockReturnValue('I am doing well')

      await createChat(apiKey, { model, messages, maxOutput })

      expect(mockModelInstance.startChat).toHaveBeenCalledWith({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }]
          },
          {
            role: 'model',
            parts: [{ text: 'Hi there!' }]
          },
          {
            role: 'user',
            parts: [{ text: 'How are you?' }]
          }
        ],
        generationConfig: { max_output_tokens: maxOutput }
      })
      expect(mockChat.sendMessage).toHaveBeenCalledWith('How are you?')
    })

    it('should throw error for invalid role', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-1.5-pro'
      const messages = [{ role: 'invalid', content: 'Hello' }]
      const maxOutput = 100

      transformMessages.mockReturnValue(messages)

      await expect(createChat(apiKey, { model, messages, maxOutput }))
        .rejects.toThrow('Invalid role "invalid". Valid roles are: ["user", "model", "function", "system"].')
    })

    it('should handle valid roles correctly', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-1.5-pro'
      const messages = [
        { role: 'user', content: 'User message' },
        { role: 'model', content: 'Model message' },
        { role: 'function', content: 'Function message' },
        { role: 'system', content: 'System message' }
      ]
      const maxOutput = 100

      transformMessages.mockReturnValue(messages)
      mockResponse.text.mockReturnValue('Response')

      await createChat(apiKey, { model, messages, maxOutput })

      expect(mockModelInstance.startChat).toHaveBeenCalledWith({
        history: [
          { role: 'user', parts: [{ text: 'User message' }] },
          { role: 'model', parts: [{ text: 'Model message' }] },
          { role: 'function', parts: [{ text: 'Function message' }] },
          { role: 'system', parts: [{ text: 'System message' }] }
        ],
        generationConfig: { max_output_tokens: maxOutput }
      })
    })

    it('should handle API errors gracefully', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-1.5-pro'
      const messages = [{ role: 'user', content: 'Hello' }]
      const maxOutput = 100

      transformMessages.mockReturnValue(messages)
      mockChat.sendMessage.mockRejectedValue(new Error('API quota exceeded'))

      await expect(createChat(apiKey, { model, messages, maxOutput }))
        .rejects.toThrow('Error processing request with Gemini: API quota exceeded')
    })

    it('should handle different models', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-2.0-flash'
      const messages = [{ role: 'user', content: 'Test' }]
      const maxOutput = 25

      transformMessages.mockReturnValue(messages)
      mockResponse.text.mockReturnValue('Test response')

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' })
      expect(mockModelInstance.startChat).toHaveBeenCalledWith({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Test' }]
          }
        ],
        generationConfig: { max_output_tokens: 25 }
      })
      expect(result).toBe('Test response')
    })

    it('should handle empty messages correctly', async () => {
      const apiKey = 'test-api-key'
      const model = 'gemini-1.5-pro'
      const messages = [{ role: 'user', content: '' }]
      const maxOutput = 100

      transformMessages.mockReturnValue(messages)
      mockResponse.text.mockReturnValue('I received an empty message')

      const result = await createChat(apiKey, { model, messages, maxOutput })

      expect(mockChat.sendMessage).toHaveBeenCalledWith('')
      expect(result).toBe('I received an empty message')
    })
  })
})