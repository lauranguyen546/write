/**
 * Anthropic API adapter
 */

import { LLMClient, LLMMessage, LLMResponse, LLMClientConfig } from './client';

export class AnthropicAdapter implements LLMClient {
  private config: LLMClientConfig;
  
  constructor(config: LLMClientConfig) {
    this.config = config;
  }
  
  async complete(messages: LLMMessage[], options?: Partial<LLMClientConfig>): Promise<LLMResponse> {
    const model = options?.model || this.config.model || 'claude-sonnet-4-20250514';
    const temperature = options?.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || this.config.maxTokens || 4000;
    
    // Convert messages to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
    
    const requestBody: any = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: conversationMessages,
    };
    
    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }
  
  getProvider(): string {
    return 'anthropic';
  }
  
  getModel(): string {
    return this.config.model || 'claude-sonnet-4-20250514';
  }
}
