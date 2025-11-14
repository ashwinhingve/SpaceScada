'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isValidEmail =
  exports.isValidPort =
  exports.isValidIpAddress =
  exports.coerceTagValue =
  exports.validateTagValue =
    void 0;
const shared_types_1 = require('@webscada/shared-types');
const validateTagValue = (value, dataType) => {
  switch (dataType) {
    case shared_types_1.DataType.BOOLEAN:
      return typeof value === 'boolean';
    case shared_types_1.DataType.INT16:
      return (
        typeof value === 'number' && Number.isInteger(value) && value >= -32768 && value <= 32767
      );
    case shared_types_1.DataType.INT32:
      return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= -2147483648 &&
        value <= 2147483647
      );
    case shared_types_1.DataType.FLOAT:
    case shared_types_1.DataType.DOUBLE:
      return typeof value === 'number' && !isNaN(value);
    case shared_types_1.DataType.STRING:
      return typeof value === 'string';
    default:
      return false;
  }
};
exports.validateTagValue = validateTagValue;
const coerceTagValue = (value, dataType) => {
  try {
    switch (dataType) {
      case shared_types_1.DataType.BOOLEAN:
        return Boolean(value);
      case shared_types_1.DataType.INT16:
      case shared_types_1.DataType.INT32:
        return parseInt(String(value), 10);
      case shared_types_1.DataType.FLOAT:
      case shared_types_1.DataType.DOUBLE:
        return parseFloat(String(value));
      case shared_types_1.DataType.STRING:
        return String(value);
      default:
        return null;
    }
  } catch {
    return null;
  }
};
exports.coerceTagValue = coerceTagValue;
const isValidIpAddress = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  const parts = ip.split('.');
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};
exports.isValidIpAddress = isValidIpAddress;
const isValidPort = (port) => {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};
exports.isValidPort = isValidPort;
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
