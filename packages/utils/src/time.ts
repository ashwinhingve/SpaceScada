export const formatTimestamp = (date: Date): string => {
  return date.toISOString();
};

export const parseTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

export const getTimeRange = (
  duration: number,
  unit: 'minutes' | 'hours' | 'days' = 'hours'
): { start: Date; end: Date } => {
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

export const roundToInterval = (date: Date, intervalMs: number): Date => {
  const time = date.getTime();
  const rounded = Math.floor(time / intervalMs) * intervalMs;
  return new Date(rounded);
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};
