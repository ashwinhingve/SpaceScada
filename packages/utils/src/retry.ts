export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const currentDelay = backoff
          ? Math.min(delay * Math.pow(2, attempt - 1), maxDelay)
          : delay;

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await sleep(currentDelay);
      }
    }
  }

  throw lastError!;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
