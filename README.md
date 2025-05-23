# LLMrest

A lightweight, unified JavaScript library for interacting with multiple LLM providers including OpenAI, Anthropic Claude, Google Gemini, and Perplexity.

[![npm version](https://img.shields.io/npm/v/@armagank/llmrest.svg)](https://www.npmjs.com/package/@armagank/llmrest)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **Unified API** - Single interface to work with multiple LLM providers
- **Support for major models** - Works with GPT models, Claude models, Gemini models, and Llama models
- **Middleware support** - Built-in content moderation and input validation
- **Error handling** - Robust error handling with detailed error messages
- **Concurrent requests** - Make parallel requests to multiple models
- **Flexible messaging** - Send different messages to different models

## Installation

```bash
npm install @armagank/llmrest
```

## Quick Start

```javascript
const { createAIClient } = require('@armagank/llmrest');

// Initialize with your API keys
const client = createAIClient({
  apiKeys: {
    openai: 'your-openai-api-key',
    claude: 'your-anthropic-api-key',
    gemini: 'your-google-api-key',
    perplexity: 'your-perplexity-api-key'
  }
});

// Use the same messages for multiple models
async function chatWithModels() {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ];
  
  const response = await client.createChat({
    models: ['gpt-4', 'claude-3-opus-20240229'],
    messages,
    maxInput: 100000,  // bytes
    maxOutput: 1000,   // tokens
    moderationEnabled: true
  });
  
  console.log(response);
}

// Use different messages for different models
async function chatWithCustomMessages() {
  const modelMessages = {
    'gpt-4': [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: 'Explain quantum computing.' }
    ],
    'claude-3-opus-20240229': [
      { role: 'system', content: 'You are Claude, an AI assistant by Anthropic.' },
      { role: 'user', content: 'Explain quantum computing in simple terms.' }
    ]
  };
  
  const response = await client.createChatMessages({
    models: ['gpt-4', 'claude-3-opus-20240229'],
    messages: modelMessages,
    maxInput: 100000,
    maxOutput: 1000,
    moderationEnabled: false
  });
  
  console.log(response);
}
```

## API Reference

### `createAIClient(options)`

Creates a new LLMrest client.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.apiKeys` | `Object` | Object containing API keys for each provider |

Returns an object with the following methods:

### `client.createChat(options)`

Send the same messages to multiple models.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.models` | `Array<string>` | Array of model identifiers |
| `options.messages` | `Array<Object>` | Array of message objects |
| `options.maxInput` | `number` | Maximum input size in bytes |
| `options.maxOutput` | `number` | Maximum output tokens |
| `options.moderationEnabled` | `boolean` | Whether to run content moderation |

### `client.createChatMessages(options)`

Send different messages to different models.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.models` | `Array<string>` | Array of model identifiers |
| `options.messages` | `Object` | Object mapping model IDs to message arrays |
| `options.maxInput` | `number` | Maximum input size in bytes |
| `options.maxOutput` | `number` | Maximum output tokens |
| `options.moderationEnabled` | `boolean` | Whether to run content moderation |

## Supported Models

- **OpenAI**: Models starting with `gpt-` (e.g., `gpt-4`, `gpt-3.5-turbo`)
- **Anthropic**: Models starting with `claude-` (e.g., `claude-3-opus-20240229`, `claude-3-sonnet-20240229`)
- **Google**: Models starting with `gemini-` (e.g., `gemini-pro`, `gemini-ultra`)
- **Perplexity**: Models starting with `llama-` (e.g., `llama-3-70b-instruct`)

## Error Handling

LLMrest handles errors gracefully and provides detailed error messages. The response will include error details for any model that failed to process.

```javascript
// Example response with an error
{
  'gpt-4': 'The capital of France is Paris.',
  'claude-3-opus-20240229': { error: 'API key is invalid.' }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.