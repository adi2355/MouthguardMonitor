import * as Logger from '../utils/logging';
import { AIServiceError, AIServiceErrorType } from '../types/errors';
import { ANTHROPIC_API_URL, ANTHROPIC_API_VERSION, ANTHROPIC_API_KEY } from '../types/common';

const MODULE_NAME = 'AnthropicAPI';

/**
 * Anthropic API client
 * Handles communication with the Claude API
 */
export class AnthropicAPI {
  private apiKey: string;
  private apiUrl: string;
  private apiVersion: string;

  constructor(
    apiKey: string = "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",
    apiUrl: string = "https://api.anthropic.com/v1",
    apiVersion: string = "2023-06-01",
  ) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.apiVersion = apiVersion;
    Logger.debug(MODULE_NAME, 'Initialized');
  }

  /**
   * Send a message to the Claude API
   */
  public async sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTokens: number = 1000,
    temperature: number = 0.7,
    model: string = 'claude-3-sonnet-20240229'
  ): Promise<string> {
    try {
      Logger.debug(MODULE_NAME, `Sending message to Claude API, model: ${model}`);

      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Logger.error(
          MODULE_NAME,
          `API error: ${response.status} ${response.statusText}`,
          errorData
        );

        let errorType = AIServiceErrorType.UNKNOWN;
        let retryable = false;
        let userMessage = 'An error occurred while processing your request.';

        // Determine error type based on status code
        if (response.status === 401 || response.status === 403) {
          errorType = AIServiceErrorType.AUTHENTICATION;
          userMessage = 'Authentication error. Please check your API key.';
        } else if (response.status === 429) {
          errorType = AIServiceErrorType.RATE_LIMIT;
          retryable = true;
          userMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorType = AIServiceErrorType.SERVER;
          retryable = true;
          userMessage = 'Server error. Please try again later.';
        }

        throw new AIServiceError(
          `API error: ${response.status} ${response.statusText}`,
          errorType,
          response.status,
          retryable,
          userMessage
        );
      }

      const data = await response.json();
      Logger.debug(MODULE_NAME, 'Received response from Claude API');

      return data.content[0].text;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      Logger.logError(MODULE_NAME, error as Error, 'Failed to send message to Claude API');
      throw new AIServiceError(
        'Failed to send message to Claude API',
        AIServiceErrorType.NETWORK,
        undefined,
        true,
        'Network error. Please check your internet connection and try again.'
      );
    }
  }

  /**
   * Send a completion request to the Claude API
   * @deprecated Use sendMessage instead
   */
  public async sendCompletion(
    prompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.7,
    model: string = 'claude-3-sonnet-20240229'
  ): Promise<string> {
    try {
      Logger.debug(MODULE_NAME, `Sending completion to Claude API, model: ${model}`);

      const response = await fetch(`${this.apiUrl}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens_to_sample: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Logger.error(
          MODULE_NAME,
          `API error: ${response.status} ${response.statusText}`,
          errorData
        );

        let errorType = AIServiceErrorType.UNKNOWN;
        let retryable = false;
        let userMessage = 'An error occurred while processing your request.';

        // Determine error type based on status code
        if (response.status === 401 || response.status === 403) {
          errorType = AIServiceErrorType.AUTHENTICATION;
          userMessage = 'Authentication error. Please check your API key.';
        } else if (response.status === 429) {
          errorType = AIServiceErrorType.RATE_LIMIT;
          retryable = true;
          userMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorType = AIServiceErrorType.SERVER;
          retryable = true;
          userMessage = 'Server error. Please try again later.';
        }

        throw new AIServiceError(
          `API error: ${response.status} ${response.statusText}`,
          errorType,
          response.status,
          retryable,
          userMessage
        );
      }

      const data = await response.json();
      Logger.debug(MODULE_NAME, 'Received response from Claude API');

      return data.completion;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      Logger.logError(MODULE_NAME, error as Error, 'Failed to send completion to Claude API');
      throw new AIServiceError(
        'Failed to send completion to Claude API',
        AIServiceErrorType.NETWORK,
        undefined,
        true,
        'Network error. Please check your internet connection and try again.'
      );
    }
  }
} 