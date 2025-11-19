import { DataPoint, DeviceTag } from '../types';
import { config } from '../config';

export class DeviceService {
  private dataHistory: Map<string, DataPoint[]> = new Map();
  private maxHistorySize: number;

  constructor() {
    this.maxHistorySize = config.dataHistorySize;
  }

  addDataPoint(tagId: string, tag: DeviceTag): void {
    if (!this.dataHistory.has(tagId)) {
      this.dataHistory.set(tagId, []);
    }

    const history = this.dataHistory.get(tagId)!;
    const dataPoint: DataPoint = {
      tagId,
      value: tag.value,
      quality: tag.quality,
      timestamp: tag.timestamp,
    };

    history.push(dataPoint);

    // Maintain circular buffer
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  getDeviceHistory(_deviceId: string, tags: DeviceTag[]): Map<string, DataPoint[]> {
    const result = new Map<string, DataPoint[]>();

    tags.forEach((tag) => {
      const history = this.dataHistory.get(tag.id);
      if (history) {
        result.set(tag.id, [...history]);
      }
    });

    return result;
  }

  getTagHistory(tagId: string, limit?: number): DataPoint[] {
    const history = this.dataHistory.get(tagId);
    if (!history) {
      return [];
    }

    if (limit && limit < history.length) {
      return history.slice(-limit);
    }

    return [...history];
  }

  clearHistory(tagId?: string): void {
    if (tagId) {
      this.dataHistory.delete(tagId);
    } else {
      this.dataHistory.clear();
    }
  }

  getHistorySize(tagId: string): number {
    return this.dataHistory.get(tagId)?.length || 0;
  }

  getTotalHistorySize(): number {
    let total = 0;
    this.dataHistory.forEach((history) => {
      total += history.length;
    });
    return total;
  }
}
