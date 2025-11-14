export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}
export declare const retry: <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T>;
export declare const sleep: (ms: number) => Promise<void>;
//# sourceMappingURL=retry.d.ts.map
