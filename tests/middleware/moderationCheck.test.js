const { moderationCheck } = require('../../lib/middleware/moderationCheck')
const OpenAI = require('openai')

jest.mock('openai')

describe('moderationCheck', () => {
  let mockOpenAI
  let mockModerations

  beforeEach(() => {
    mockModerations = {
      create: jest.fn()
    }
    mockOpenAI = {
      moderations: mockModerations
    }
    OpenAI.mockImplementation(() => mockOpenAI)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should pass when content is not flagged', async () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you!' }
    ]
    const apiKey = 'test-api-key'

    mockModerations.create.mockResolvedValue({
      results: [
        { flagged: false },
        { flagged: false }
      ]
    })

    await expect(moderationCheck(apiKey, messages)).resolves.not.toThrow()

    expect(OpenAI).toHaveBeenCalledWith({ apiKey })
    expect(mockModerations.create).toHaveBeenCalledWith({
      input: ['Hello, how are you?', 'I am doing well, thank you!']
    })
  })

  it('should throw error when content is flagged', async () => {
    const messages = [
      { role: 'user', content: 'Inappropriate content' },
      { role: 'assistant', content: 'Normal response' }
    ]
    const apiKey = 'test-api-key'

    mockModerations.create.mockResolvedValue({
      results: [
        { flagged: true },
        { flagged: false }
      ]
    })

    await expect(moderationCheck(apiKey, messages))
      .rejects.toThrow('Input contains restricted or potentially harmful content.')

    expect(OpenAI).toHaveBeenCalledWith({ apiKey })
    expect(mockModerations.create).toHaveBeenCalledWith({
      input: ['Inappropriate content', 'Normal response']
    })
  })

  it('should handle empty messages array', async () => {
    const messages = []
    const apiKey = 'test-api-key'

    mockModerations.create.mockResolvedValue({
      results: []
    })

    await expect(moderationCheck(apiKey, messages)).resolves.not.toThrow()

    expect(mockModerations.create).toHaveBeenCalledWith({
      input: []
    })
  })

  it('should handle single message', async () => {
    const messages = [
      { role: 'user', content: 'Single message content' }
    ]
    const apiKey = 'test-api-key'

    mockModerations.create.mockResolvedValue({
      results: [
        { flagged: false }
      ]
    })

    await expect(moderationCheck(apiKey, messages)).resolves.not.toThrow()

    expect(mockModerations.create).toHaveBeenCalledWith({
      input: ['Single message content']
    })
  })

  it('should handle OpenAI API errors', async () => {
    const messages = [
      { role: 'user', content: 'Test message' }
    ]
    const apiKey = 'test-api-key'

    mockModerations.create.mockRejectedValue(new Error('API Error'))

    await expect(moderationCheck(apiKey, messages))
      .rejects.toThrow('API Error')
  })
})