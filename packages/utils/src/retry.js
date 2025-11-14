'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.sleep = exports.retry = void 0;
const retry = async (fn, options = {}) => {
  const { maxAttempts = 3, delay = 1000, backoff = true, maxDelay = 10000, onRetry } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const currentDelay = backoff ? Math.min(delay * Math.pow(2, attempt - 1), maxDelay) : delay;
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        await (0, exports.sleep)(currentDelay);
      }
    }
  }
  throw lastError;
};
exports.retry = retry;
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
