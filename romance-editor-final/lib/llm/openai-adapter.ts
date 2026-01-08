/**
 * OpenAI API adapter
 */

import { LLMClient, LLMMessage, LLMResponse, LLMClientConfig } from './client';

export class OpenAIAdapter implements LLMClient {
  private config: LLMClientConfig;
  
  constructor(config: LLMClientConfig) {
    this.config = config;
  }
  
  async complete(messages: LLMMessage[], options?: Partial<LLMClientConfig>): Promise<LLMResponse> {
    const model = options?.model || this.config.model || 'gpt-4-turbo-preview';
    const temperature = options?.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || this.config.maxTokens || 4000;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }
  
  getProvider(): string {
    return 'openai';
  }
  
  getModel(): string {
    return this.config.model || 'gpt-4-turbo-preview';
  }
}
