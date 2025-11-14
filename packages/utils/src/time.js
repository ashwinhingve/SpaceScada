'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.formatDuration =
  exports.roundToInterval =
  exports.getTimeRange =
  exports.parseTimestamp =
  exports.formatTimestamp =
    void 0;
const formatTimestamp = (date) => {
  return date.toISOString();
};
exports.formatTimestamp = formatTimestamp;
const parseTimestamp = (timestamp) => {
  return new Date(timestamp);
};
exports.parseTimestamp = parseTimestamp;
const getTimeRange = (duration, unit = 'hours') => {
  const end = new Date();
  const start = new Date(end);
  switch (unit) {
    case 'minutes':
      start.setMinutes(start.getMinutes() - duration);
      break;
    case 'hours':
      start.setHours(start.getHours() - duration);
      break;
    case 'days':
      start.setDate(start.getDate() - duration);
      break;
  }
  return { start, end };
};
exports.getTimeRange = getTimeRange;
const roundToInterval = (date, intervalMs) => {
  const time = date.getTime();
  const rounded = Math.floor(time / intervalMs) * intervalMs;
  return new Date(rounded);
};
exports.roundToInterval = roundToInterval;
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};
exports.formatDuration = formatDuration;
