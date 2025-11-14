export declare enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}
export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}
export declare class Logger {
  private level;
  private prefix;
  private timestamp;
  constructor(options?: LoggerOptions);
  private shouldLog;
  private format;
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}
export declare const createLogger: (options?: LoggerOptions) => Logger;
//# sourceMappingURL=logger.d.ts.map
