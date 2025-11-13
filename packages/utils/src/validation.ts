import { DataType, TagValue } from '@webscada/shared-types';

export const validateTagValue = (value: unknown, dataType: DataType): boolean => {
  switch (dataType) {
    case DataType.BOOLEAN:
      return typeof value === 'boolean';
    case DataType.INT16:
      return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= -32768 &&
        value <= 32767
      );
    case DataType.INT32:
      return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= -2147483648 &&
        value <= 2147483647
      );
    case DataType.FLOAT:
    case DataType.DOUBLE:
      return typeof value === 'number' && !isNaN(value);
    case DataType.STRING:
      return typeof value === 'string';
    default:
      return false;
  }
};

export const coerceTagValue = (value: unknown, dataType: DataType): TagValue => {
  try {
    switch (dataType) {
      case DataType.BOOLEAN:
        return Boolean(value);
      case DataType.INT16:
      case DataType.INT32:
        return parseInt(String(value), 10);
      case DataType.FLOAT:
      case DataType.DOUBLE:
        return parseFloat(String(value));
      case DataType.STRING:
        return String(value);
      default:
        return null;
    }
  } catch {
    return null;
  }
};

export const isValidIpAddress = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

export const isValidPort = (port: number): boolean => {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
