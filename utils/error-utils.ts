/**
 * Standardized error handling utilities
 */

// Error types
export enum ContractErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ContractError extends Error {
  type: ContractErrorType
  code?: string | number
  data?: any
  context?: string
}

// Create standardized contract error
export function createContractError(
  type: ContractErrorType,
  message: string,
  originalError?: Error,
  context?: string,
  code?: string | number
): ContractError {
  const error = new Error(message) as ContractError
  error.type = type
  error.context = context
  error.code = code

  if (originalError) {
    error.stack = originalError.stack
    error.cause = originalError
  }

  return error
}

// Handle contract call errors
export function handleContractError(error: any, context?: string): ContractError {
  // Network errors (connection issues, timeouts)
  if (error?.code === 'NETWORK_ERROR' || error?.code === -32000) {
    return createContractError(
      ContractErrorType.NETWORK_ERROR,
      'Network connection failed',
      error,
      context
    )
  }

  // Contract execution errors
  if (error?.code === 'CALL_EXCEPTION' || error?.code === -32000) {
    return createContractError(
      ContractErrorType.CONTRACT_ERROR,
      error?.reason || 'Contract execution failed',
      error,
      context,
      error?.code
    )
  }

  // Parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return createContractError(
      ContractErrorType.PARSING_ERROR,
      'Failed to parse contract response',
      error,
      context
    )
  }

  // Timeout errors
  if (error?.code === 'TIMEOUT' || error?.name === 'TimeoutError') {
    return createContractError(
      ContractErrorType.TIMEOUT_ERROR,
      'Request timed out',
      error,
      context
    )
  }

  // Unknown errors
  return createContractError(
    ContractErrorType.UNKNOWN_ERROR,
    error?.message || 'Unknown error occurred',
    error,
    context
  )
}

// Get user-friendly error message
export function getErrorMessage(error: ContractError): string {
  switch (error.type) {
    case ContractErrorType.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection and try again.'
    case ContractErrorType.CONTRACT_ERROR:
      return `Contract error: ${error.message}`
    case ContractErrorType.PARSING_ERROR:
      return 'Failed to parse blockchain data. The data format may be invalid.'
    case ContractErrorType.VALIDATION_ERROR:
      return error.message
    case ContractErrorType.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

// Log error with context
export function logContractError(error: ContractError, context?: string): void {
  const logContext = context || error.context || 'unknown'
  console.error(`[${logContext}] Contract Error:`, {
    type: error.type,
    message: error.message,
    code: error.code,
    stack: error.stack,
  })
}

// Retry function for contract calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on certain error types
      if (error instanceof Error) {
        const contractError = handleContractError(error)
        if (contractError.type === ContractErrorType.VALIDATION_ERROR) {
          throw contractError
        }
      }

      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw handleContractError(lastError, 'withRetry')
}
