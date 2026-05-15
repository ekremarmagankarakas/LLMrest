// OpenAI chat completion models (source: openai-python SDK types, May 2026)
export const OPENAI_MODELS: readonly string[] = [
  // GPT-5 series
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5.1',
  'gpt-5.2',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  // GPT-4.1 series
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  // GPT-4o series
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  // O-series reasoning models
  'o1',
  'o1-mini',
  'o3',
  'o3-mini',
  'o4-mini',
];

// Anthropic Claude models (source: platform.claude.com/docs, May 2026)
export const CLAUDE_MODELS: readonly string[] = [
  // Current generation
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5',
  // Legacy (still available, consider migrating)
  'claude-opus-4-6',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-5',
  'claude-opus-4-5-20251101',
  'claude-opus-4-5',
  'claude-opus-4-1-20250805',
  'claude-opus-4-1',
];

// Google Gemini models (source: ai.google.dev/gemini-api/docs, May 2026)
export const GEMINI_MODELS: readonly string[] = [
  // Gemini 3 series (stable GA)
  'gemini-3.1-flash-lite',
  // Gemini 3 series (preview)
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  // Gemini 2.5 series (stable GA)
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

// Perplexity Sonar models (source: docs.perplexity.ai, May 2026)
export const PERPLEXITY_MODELS: readonly string[] = [
  'sonar',
  'sonar-pro',
  'sonar-reasoning-pro',
  'sonar-deep-research',
];
