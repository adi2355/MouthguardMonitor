// Define error types for better error handling
export enum AIServiceErrorType {
  NETWORK = 'network_error',
  AUTHENTICATION = 'authentication_error',
  RATE_LIMIT = 'rate_limit_error',
  SERVER = 'server_error',
  PARSING = 'parsing_error',
  TIMEOUT = 'timeout_error',
  UNKNOWN = 'unknown_error'
}

export class AIServiceError extends Error {
  type: AIServiceErrorType;
  statusCode?: number;
  retryable: boolean;
  userMessage: string;

  constructor(
    message: string, 
    type: AIServiceErrorType = AIServiceErrorType.UNKNOWN, 
    statusCode?: number,
    retryable: boolean = false,
    userMessage: string = "An error occurred while processing your request."
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.userMessage = userMessage;
  }
} 