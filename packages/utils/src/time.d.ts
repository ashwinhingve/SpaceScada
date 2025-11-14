export declare const formatTimestamp: (date: Date) => string;
export declare const parseTimestamp: (timestamp: string) => Date;
export declare const getTimeRange: (
  duration: number,
  unit?: 'minutes' | 'hours' | 'days'
) => {
  start: Date;
  end: Date;
};
export declare const roundToInterval: (date: Date, intervalMs: number) => Date;
export declare const formatDuration: (ms: number) => string;
//# sourceMappingURL=time.d.ts.map
