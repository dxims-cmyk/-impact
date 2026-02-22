// lib/errors.ts
// Standardized error handling for API routes

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter })
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}

// Error response interface
interface ErrorResponse {
  error: string
  code: string
  details?: unknown
}

/**
 * Create standardized error response
 */
export function errorResponse(
  error: AppError | Error | ZodError | unknown
): NextResponse<ErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.flatten(),
      },
      { status: 400 }
    )
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Handle standard errors
  if (error instanceof Error) {
    console.error('Unhandled error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  console.error('Unknown error:', error)
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  )
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse<ErrorResponse>> {
  return handler().catch(error => errorResponse(error))
}

/**
 * Assert condition or throw error
 */
export function assert(
  condition: unknown,
  error: AppError | string
): asserts condition {
  if (!condition) {
    throw typeof error === 'string' ? new AppError(error, 400) : error
  }
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: { code?: string; message?: string }): AppError {
  switch (error.code) {
    case 'PGRST116':
      return new NotFoundError()
    case '23505':
      return new ConflictError('Resource already exists')
    case '23503':
      return new ValidationError('Referenced resource does not exist')
    case '42501':
      return new ForbiddenError('Permission denied')
    default:
      return new AppError(error.message || 'Database error', 500, 'DATABASE_ERROR')
  }
}
