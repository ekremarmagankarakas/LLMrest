export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ApiKeys {
  openai?: string;
  claude?: string;
  gemini?: string;
  perplexity?: string;
}

export interface ProviderChatOptions {
  model: string;
  messages: Message[];
  maxOutput?: number;
}

export interface LLMClientOptions {
  apiKeys: ApiKeys;
}

export interface ChatParams {
  models: string[];
  messages: Message[];
  maxInput?: number;
  maxOutput?: number;
  moderationEnabled?: boolean;
}

export interface ChatMessagesParams {
  models: string[];
  messages: Record<string, Message[]>;
  maxInput?: number;
  maxOutput?: number;
  moderationEnabled?: boolean;
}

export interface StreamingResponse {
  model: string;
  status: 'success' | 'error';
  data?: string;
  error?: string;
  timestamp: string;
}

export interface ChatStreamingParams {
  models: string[];
  messages: Message[] | Record<string, Message[]>;
  maxInput?: number;
  maxOutput?: number;
  moderationEnabled?: boolean;
  onResponse: (response: StreamingResponse) => void;
}

export type ChatResult = Record<string, string | { error: string }>;
