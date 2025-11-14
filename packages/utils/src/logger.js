'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.createLogger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
  LogLevel['DEBUG'] = 'DEBUG';
  LogLevel['INFO'] = 'INFO';
  LogLevel['WARN'] = 'WARN';
  LogLevel['ERROR'] = 'ERROR';
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
  level;
  prefix;
  timestamp;
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO;
    this.prefix = options.prefix || '';
    this.timestamp = options.timestamp !== false;
  }
  shouldLog(level) {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
  format(level, message, meta) {
    const parts = [];
    if (this.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    parts.push(`[${level}]`);
    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }
    parts.push(message);
    if (meta) {
      parts.push(JSON.stringify(meta, null, 2));
    }
    return parts.join(' ');
  }
  debug(message, meta) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format(LogLevel.DEBUG, message, meta));
    }
  }
  info(message, meta) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(LogLevel.INFO, message, meta));
    }
  }
  warn(message, meta) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(LogLevel.WARN, message, meta));
    }
  }
  error(message, meta) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.format(LogLevel.ERROR, message, meta));
    }
  }
}
exports.Logger = Logger;
const createLogger = (options) => {
  return new Logger(options);
};
exports.createLogger = createLogger;
