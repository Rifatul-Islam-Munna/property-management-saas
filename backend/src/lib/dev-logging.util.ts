import { Logger } from '@nestjs/common';

const REDACT_KEYS = ['password', 'token', 'secret', 'authorization', 'cookie', 'refreshToken', 'accessToken'];
const MAX_STRING_LENGTH = 300;
const MAX_ARRAY_ITEMS = 10;
const MAX_OBJECT_KEYS = 20;

export function isDevLoggingEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_TRACE_LOGS !== 'false';
}

export function createDevLogger(context: string) {
  return new Logger(context);
}

export function sanitizeForDevLog(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 3) return '[MaxDepth]';

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeForDevLog(item, depth + 1));
  }

  if (typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(input).slice(0, MAX_OBJECT_KEYS)) {
      if (REDACT_KEYS.some((redactKey) => key.toLowerCase().includes(redactKey.toLowerCase()))) {
        output[key] = '[REDACTED]';
        continue;
      }
      output[key] = sanitizeForDevLog(input[key], depth + 1);
    }

    return output;
  }

  return String(value);
}

export function stringifyForDevLog(value: unknown) {
  try {
    return JSON.stringify(sanitizeForDevLog(value), null, 2);
  } catch {
    return '[Unserializable]';
  }
}
