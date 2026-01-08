/**
 * LLM Client abstraction layer
 * Supports multiple providers (OpenAI, Anthropic)
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMClientConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMClient {
  /**
   * Generate a completion from messages
   */
  complete(messages: LLMMessage[], options?: Partial<LLMClientConfig>): Promise<LLMResponse>;
  
  /**
   * Get the provider name
   */
  getProvider(): string;
  
  /**
   * Get the model name
   */
  getModel(): string;
}

/**
 * Factory function to create LLM client based on config
 */
export async function createLLMClient(config: LLMClientConfig): Promise<LLMClient> {
  if (config.provider === 'openai') {
    const { OpenAIAdapter } = await import('./openai-adapter');
    return new OpenAIAdapter(config);
  } else if (config.provider === 'anthropic') {
    const { AnthropicAdapter } = await import('./anthropic-adapter');
    return new AnthropicAdapter(config);
  } else {
    throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

/**
 * Get LLM client from environment variables
 */
export async function getLLMClientFromEnv(): Promise<LLMClient> {
  const provider = (process.env.LLM_PROVIDER || 'anthropic') as 'openai' | 'anthropic';
  
  const config: LLMClientConfig = {
    provider,
    apiKey: provider === 'openai' 
      ? process.env.OPENAI_API_KEY || ''
      : process.env.ANTHROPIC_API_KEY || '',
    model: provider === 'openai'
      ? process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
      : process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 4000,
  };
  
  if (!config.apiKey) {
    throw new Error(`API key not found for provider: ${provider}`);
  }
  
  return createLLMClient(config);
}
