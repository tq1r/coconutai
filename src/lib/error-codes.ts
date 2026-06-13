export const ErrorCodes = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_IN_USE: 'AUTH_EMAIL_IN_USE',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_INVALID_RESET_TOKEN: 'AUTH_INVALID_RESET_TOKEN',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',

  // Validation
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_CODE: 'VALIDATION_INVALID_CODE',

  // Resource
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LIMIT_REACHED: 'RESOURCE_LIMIT_REACHED',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Plugin
  PLUGIN_SESSION_NOT_FOUND: 'PLUGIN_SESSION_NOT_FOUND',
  PLUGIN_SESSION_CLOSED: 'PLUGIN_SESSION_CLOSED',
  PLUGIN_CODE_INVALID: 'PLUGIN_CODE_INVALID',
  PLUGIN_PUSH_FAILED: 'PLUGIN_PUSH_FAILED',

  // AI
  AI_NO_API_KEY: 'AI_NO_API_KEY',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  AI_MODEL_NOT_FOUND: 'AI_MODEL_NOT_FOUND',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',

  // Workspace
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  WORKSPACE_LIMIT_REACHED: 'WORKSPACE_LIMIT_REACHED',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_LIMIT_REACHED: 'PROJECT_LIMIT_REACHED',

  // Server
  SERVER_INTERNAL_ERROR: 'SERVER_INTERNAL_ERROR',
  SERVER_RATE_LIMITED: 'SERVER_RATE_LIMITED',
  SERVER_MAINTENANCE: 'SERVER_MAINTENANCE',
  SERVER_TIMEOUT: 'SERVER_TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const errorStatusMap: Record<ErrorCode, number> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCodes.AUTH_TOKEN_MISSING]: 401,
  [ErrorCodes.AUTH_UNAUTHORIZED]: 403,
  [ErrorCodes.AUTH_USER_NOT_FOUND]: 404,
  [ErrorCodes.AUTH_EMAIL_IN_USE]: 409,
  [ErrorCodes.AUTH_WEAK_PASSWORD]: 422,
  [ErrorCodes.AUTH_INVALID_RESET_TOKEN]: 400,
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 401,
  [ErrorCodes.AUTH_ACCOUNT_DISABLED]: 403,

  [ErrorCodes.VALIDATION_MISSING_FIELD]: 400,
  [ErrorCodes.VALIDATION_INVALID_INPUT]: 400,
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 400,
  [ErrorCodes.VALIDATION_INVALID_CODE]: 400,

  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_CONFLICT]: 409,
  [ErrorCodes.RESOURCE_LIMIT_REACHED]: 429,
  [ErrorCodes.RESOURCE_ALREADY_EXISTS]: 409,

  [ErrorCodes.PLUGIN_SESSION_NOT_FOUND]: 404,
  [ErrorCodes.PLUGIN_SESSION_CLOSED]: 410,
  [ErrorCodes.PLUGIN_CODE_INVALID]: 400,
  [ErrorCodes.PLUGIN_PUSH_FAILED]: 500,

  [ErrorCodes.AI_NO_API_KEY]: 500,
  [ErrorCodes.AI_GENERATION_FAILED]: 500,
  [ErrorCodes.AI_MODEL_NOT_FOUND]: 404,
  [ErrorCodes.AI_RATE_LIMITED]: 429,
  [ErrorCodes.AI_QUOTA_EXCEEDED]: 403,

  [ErrorCodes.WORKSPACE_NOT_FOUND]: 404,
  [ErrorCodes.WORKSPACE_LIMIT_REACHED]: 429,
  [ErrorCodes.PROJECT_NOT_FOUND]: 404,
  [ErrorCodes.PROJECT_LIMIT_REACHED]: 429,

  [ErrorCodes.SERVER_INTERNAL_ERROR]: 500,
  [ErrorCodes.SERVER_RATE_LIMITED]: 429,
  [ErrorCodes.SERVER_MAINTENANCE]: 503,
  [ErrorCodes.SERVER_TIMEOUT]: 504,
};

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Session expired. Please sign in again',
  [ErrorCodes.AUTH_TOKEN_MISSING]: 'Authentication required',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'You do not have permission to perform this action',
  [ErrorCodes.AUTH_USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.AUTH_EMAIL_IN_USE]: 'An account with this email already exists',
  [ErrorCodes.AUTH_WEAK_PASSWORD]: 'Password must be at least 8 characters',
  [ErrorCodes.AUTH_INVALID_RESET_TOKEN]: 'Invalid or expired reset token',
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Session expired. Please sign in again',
  [ErrorCodes.AUTH_ACCOUNT_DISABLED]: 'This account has been disabled',

  [ErrorCodes.VALIDATION_MISSING_FIELD]: 'Required field is missing',
  [ErrorCodes.VALIDATION_INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 'Invalid email format',
  [ErrorCodes.VALIDATION_INVALID_CODE]: 'Invalid code format',

  [ErrorCodes.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCodes.RESOURCE_CONFLICT]: 'Resource conflict',
  [ErrorCodes.RESOURCE_LIMIT_REACHED]: 'Resource limit reached',
  [ErrorCodes.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',

  [ErrorCodes.PLUGIN_SESSION_NOT_FOUND]: 'Plugin session not found. Check your connection code',
  [ErrorCodes.PLUGIN_SESSION_CLOSED]: 'Plugin session has been closed',
  [ErrorCodes.PLUGIN_CODE_INVALID]: 'Connection code must be exactly 6 characters',
  [ErrorCodes.PLUGIN_PUSH_FAILED]: 'Failed to push code to Studio',

  [ErrorCodes.AI_NO_API_KEY]: 'AI service not configured. Contact support',
  [ErrorCodes.AI_GENERATION_FAILED]: 'AI generation failed. Please try again',
  [ErrorCodes.AI_MODEL_NOT_FOUND]: 'AI model not found',
  [ErrorCodes.AI_RATE_LIMITED]: 'Too many requests. Please wait and try again',
  [ErrorCodes.AI_QUOTA_EXCEEDED]: 'Monthly AI quota exceeded. Upgrade to premium',

  [ErrorCodes.WORKSPACE_NOT_FOUND]: 'Workspace not found',
  [ErrorCodes.WORKSPACE_LIMIT_REACHED]: 'Workspace limit reached',
  [ErrorCodes.PROJECT_NOT_FOUND]: 'Project not found',
  [ErrorCodes.PROJECT_LIMIT_REACHED]: 'Project limit reached',

  [ErrorCodes.SERVER_INTERNAL_ERROR]: 'Internal server error. Please try again',
  [ErrorCodes.SERVER_RATE_LIMITED]: 'Too many requests. Please slow down',
  [ErrorCodes.SERVER_MAINTENANCE]: 'Server is under maintenance. Please check back later',
  [ErrorCodes.SERVER_TIMEOUT]: 'Request timed out. Please try again',
};

export function apiError(code: ErrorCode, overrideMessage?: string) {
  return {
    success: false,
    error: overrideMessage || errorMessages[code],
    code,
    status: errorStatusMap[code],
  };
}

export function apiSuccess<T>(data: T, extra?: Record<string, unknown>) {
  return { success: true, data, ...extra };
}
