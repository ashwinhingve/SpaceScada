import { Counter, Gauge, Histogram, register } from 'prom-client';
import { config } from '../config';

export class MetricsService {
  private httpRequestsTotal: Counter;
  private websocketConnectionsCurrent: Gauge;
  private dataPointsGenerated: Counter;
  private websocketMessagesSent: Counter;
  private requestDuration: Histogram;

  constructor() {
    // HTTP request counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    // WebSocket connections gauge
    this.websocketConnectionsCurrent = new Gauge({
      name: 'websocket_connections_current',
      help: 'Current number of WebSocket connections',
    });

    // Data points generated counter
    this.dataPointsGenerated = new Counter({
      name: 'data_points_generated_total',
      help: 'Total number of data points generated',
      labelNames: ['device_id', 'tag_id'],
    });

    // WebSocket messages sent counter
    this.websocketMessagesSent = new Counter({
      name: 'websocket_messages_sent_total',
      help: 'Total number of WebSocket messages sent',
      labelNames: ['event_type'],
    });

    // Request duration histogram
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    });
  }

  recordHttpRequest(method: string, path: string, status: number): void {
    this.httpRequestsTotal.inc({ method, path, status });
  }

  recordRequestDuration(method: string, path: string, status: number, duration: number): void {
    this.requestDuration.observe({ method, path, status }, duration);
  }

  setWebSocketConnections(count: number): void {
    this.websocketConnectionsCurrent.set(count);
  }

  incrementWebSocketConnections(): void {
    this.websocketConnectionsCurrent.inc();
  }

  decrementWebSocketConnections(): void {
    this.websocketConnectionsCurrent.dec();
  }

  recordDataPoint(deviceId: string, tagId: string): void {
    this.dataPointsGenerated.inc({ device_id: deviceId, tag_id: tagId });
  }

  recordWebSocketMessage(eventType: string): void {
    this.websocketMessagesSent.inc({ event_type: eventType });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  getContentType(): string {
    return register.contentType;
  }

  isEnabled(): boolean {
    return config.enableMetrics;
  }
}
