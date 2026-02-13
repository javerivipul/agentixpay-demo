/**
 * Wrap data in a standard success response envelope.
 */
export function successResponse<T>(data: T) {
  return { success: true, data };
}

/**
 * Format an error into a standard error response envelope.
 */
export function errorResponse(code: string, message: string, details?: unknown) {
  return {
    success: false,
    error: { code, message, details },
  };
}
