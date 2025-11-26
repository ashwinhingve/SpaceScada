/**
 * Sparkplug B Data Normalizer
 *
 * Converts protocol-specific data into Sparkplug B format for unified messaging.
 * This is the core of protocol normalization in the gateway architecture.
 *
 * Sparkplug B Specification: Eclipse Sparkplug™ 3.0.0
 * https://sparkplug.eclipse.org/
 */

import {
  DataPoint,
  DataType,
  DataQuality,
  ProtocolType,
} from '../abstraction/protocol-adapter.interface';

/**
 * Sparkplug B Metric Types
 */
export enum SparkplugMetricDataType {
  Unknown = 0,
  Int8 = 1,
  Int16 = 2,
  Int32 = 3,
  Int64 = 4,
  UInt8 = 5,
  UInt16 = 6,
  UInt32 = 7,
  UInt64 = 8,
  Float = 9,
  Double = 10,
  Boolean = 11,
  String = 12,
  DateTime = 13,
  Text = 14,
  UUID = 15,
  DataSet = 16,
  Bytes = 17,
  File = 18,
  Template = 19,
}

/**
 * Sparkplug B Metric
 */
export interface SparkplugMetric {
  name: string;
  alias?: number;
  timestamp: number;
  dataType: SparkplugMetricDataType;
  isHistorical?: boolean;
  isTransient?: boolean;
  isNull?: boolean;
  metadata?: SparkplugMetadata;
  properties?: SparkplugPropertySet;

  // Value fields (only one should be set based on dataType)
  intValue?: number;
  longValue?: bigint;
  floatValue?: number;
  doubleValue?: number;
  booleanValue?: boolean;
  stringValue?: string;
  bytesValue?: Uint8Array;
}

export interface SparkplugMetadata {
  contentType?: string;
  size?: number;
  seq?: number;
  fileName?: string;
  fileType?: string;
  md5?: string;
  description?: string;
}

export interface SparkplugPropertySet {
  keys: string[];
  values: SparkplugPropertyValue[];
}

export interface SparkplugPropertyValue {
  type: SparkplugMetricDataType;
  isNull?: boolean;
  intValue?: number;
  longValue?: bigint;
  floatValue?: number;
  doubleValue?: number;
  booleanValue?: boolean;
  stringValue?: string;
}

/**
 * Sparkplug B Payload
 */
export interface SparkplugPayload {
  timestamp: number;
  metrics: SparkplugMetric[];
  seq: number;
  uuid?: string;
  body?: Uint8Array;
}

/**
 * Normalized Telemetry Message (Sparkplug B Format)
 */
export interface NormalizedTelemetryMessage {
  messageType: 'NBIRTH' | 'NDEATH' | 'DBIRTH' | 'DDEATH' | 'NDATA' | 'DDATA' | 'NCMD' | 'DCMD';
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;
  payload: SparkplugPayload;

  // Metadata
  protocol: ProtocolType;
  gatewayId: string;
  receivedAt: number;
}

/**
 * Sparkplug B Data Normalizer
 */
export class SparkplugNormalizer {
  private sequenceNumber: number = 0;
  private readonly MAX_SEQ = 256;

  /**
   * Convert protocol-specific DataPoint to Sparkplug B metric
   */
  dataPointToMetric(dataPoint: DataPoint): SparkplugMetric {
    const metric: SparkplugMetric = {
      name: dataPoint.name,
      timestamp: dataPoint.timestamp,
      dataType: this.mapDataType(dataPoint.dataType),
      isNull: dataPoint.value === null || dataPoint.value === undefined,
    };

    // Set value based on data type
    this.setMetricValue(metric, dataPoint.value, metric.dataType);

    // Add quality as metadata if not GOOD
    if (dataPoint.quality !== DataQuality.GOOD) {
      metric.metadata = {
        description: `Quality: ${dataPoint.quality}`,
      };
    }

    // Add properties from metadata
    if (dataPoint.metadata) {
      metric.properties = this.buildPropertySet(dataPoint.metadata);
    }

    return metric;
  }

  /**
   * Convert array of DataPoints to Sparkplug B payload
   */
  dataPointsToPayload(dataPoints: DataPoint[]): SparkplugPayload {
    const metrics = dataPoints.map((dp) => this.dataPointToMetric(dp));

    return {
      timestamp: Date.now(),
      metrics,
      seq: this.getNextSequenceNumber(),
    };
  }

  /**
   * Create normalized telemetry message
   */
  createTelemetryMessage(
    protocol: ProtocolType,
    gatewayId: string,
    groupId: string,
    edgeNodeId: string,
    deviceId: string | undefined,
    dataPoints: DataPoint[],
    messageType: NormalizedTelemetryMessage['messageType'] = 'NDATA'
  ): NormalizedTelemetryMessage {
    return {
      messageType,
      groupId,
      edgeNodeId,
      deviceId,
      payload: this.dataPointsToPayload(dataPoints),
      protocol,
      gatewayId,
      receivedAt: Date.now(),
    };
  }

  /**
   * Create NBIRTH (Node Birth) message
   */
  createNodeBirthMessage(
    protocol: ProtocolType,
    gatewayId: string,
    groupId: string,
    edgeNodeId: string,
    nodeMetrics: DataPoint[]
  ): NormalizedTelemetryMessage {
    // Reset sequence number on birth
    this.sequenceNumber = 0;

    // Add bdSeq (Birth/Death Sequence) metric
    const bdSeqMetric: SparkplugMetric = {
      name: 'bdSeq',
      timestamp: Date.now(),
      dataType: SparkplugMetricDataType.Int64,
      longValue: BigInt(this.sequenceNumber),
    };

    const payload = this.dataPointsToPayload(nodeMetrics);
    payload.metrics.unshift(bdSeqMetric);

    return {
      messageType: 'NBIRTH',
      groupId,
      edgeNodeId,
      payload,
      protocol,
      gatewayId,
      receivedAt: Date.now(),
    };
  }

  /**
   * Create DBIRTH (Device Birth) message
   */
  createDeviceBirthMessage(
    protocol: ProtocolType,
    gatewayId: string,
    groupId: string,
    edgeNodeId: string,
    deviceId: string,
    deviceMetrics: DataPoint[]
  ): NormalizedTelemetryMessage {
    return {
      messageType: 'DBIRTH',
      groupId,
      edgeNodeId,
      deviceId,
      payload: this.dataPointsToPayload(deviceMetrics),
      protocol,
      gatewayId,
      receivedAt: Date.now(),
    };
  }

  /**
   * Create NDEATH (Node Death) message
   */
  createNodeDeathMessage(
    gatewayId: string,
    groupId: string,
    edgeNodeId: string
  ): NormalizedTelemetryMessage {
    const bdSeqMetric: SparkplugMetric = {
      name: 'bdSeq',
      timestamp: Date.now(),
      dataType: SparkplugMetricDataType.Int64,
      longValue: BigInt(this.sequenceNumber),
    };

    return {
      messageType: 'NDEATH',
      groupId,
      edgeNodeId,
      payload: {
        timestamp: Date.now(),
        metrics: [bdSeqMetric],
        seq: this.sequenceNumber,
      },
      protocol: ProtocolType.MQTT_SPARKPLUG_B,
      gatewayId,
      receivedAt: Date.now(),
    };
  }

  /**
   * Map PAL DataType to Sparkplug B data type
   */
  private mapDataType(dataType: DataType): SparkplugMetricDataType {
    const mapping: Record<DataType, SparkplugMetricDataType> = {
      [DataType.BOOLEAN]: SparkplugMetricDataType.Boolean,
      [DataType.INT8]: SparkplugMetricDataType.Int8,
      [DataType.INT16]: SparkplugMetricDataType.Int16,
      [DataType.INT32]: SparkplugMetricDataType.Int32,
      [DataType.INT64]: SparkplugMetricDataType.Int64,
      [DataType.UINT8]: SparkplugMetricDataType.UInt8,
      [DataType.UINT16]: SparkplugMetricDataType.UInt16,
      [DataType.UINT32]: SparkplugMetricDataType.UInt32,
      [DataType.UINT64]: SparkplugMetricDataType.UInt64,
      [DataType.FLOAT]: SparkplugMetricDataType.Float,
      [DataType.DOUBLE]: SparkplugMetricDataType.Double,
      [DataType.STRING]: SparkplugMetricDataType.String,
      [DataType.DATETIME]: SparkplugMetricDataType.DateTime,
      [DataType.BYTES]: SparkplugMetricDataType.Bytes,
    };

    return mapping[dataType] || SparkplugMetricDataType.Unknown;
  }

  /**
   * Set metric value based on data type
   */
  private setMetricValue(
    metric: SparkplugMetric,
    value: unknown,
    dataType: SparkplugMetricDataType
  ): void {
    if (value === null || value === undefined) {
      metric.isNull = true;
      return;
    }

    switch (dataType) {
      case SparkplugMetricDataType.Boolean:
        metric.booleanValue = Boolean(value);
        break;
      case SparkplugMetricDataType.Int8:
      case SparkplugMetricDataType.Int16:
      case SparkplugMetricDataType.Int32:
      case SparkplugMetricDataType.UInt8:
      case SparkplugMetricDataType.UInt16:
      case SparkplugMetricDataType.UInt32:
        metric.intValue = Number(value);
        break;
      case SparkplugMetricDataType.Int64:
      case SparkplugMetricDataType.UInt64:
        metric.longValue = BigInt(value as string | number | bigint);
        break;
      case SparkplugMetricDataType.Float:
        metric.floatValue = Number(value);
        break;
      case SparkplugMetricDataType.Double:
        metric.doubleValue = Number(value);
        break;
      case SparkplugMetricDataType.String:
      case SparkplugMetricDataType.Text:
        metric.stringValue = String(value);
        break;
      case SparkplugMetricDataType.Bytes:
        metric.bytesValue = value instanceof Uint8Array ? value : new Uint8Array();
        break;
      default:
        metric.stringValue = String(value);
    }
  }

  /**
   * Build Sparkplug property set from metadata
   */
  private buildPropertySet(metadata: Record<string, unknown>): SparkplugPropertySet {
    const keys: string[] = [];
    const values: SparkplugPropertyValue[] = [];

    for (const [key, value] of Object.entries(metadata)) {
      keys.push(key);
      values.push(this.createPropertyValue(value));
    }

    return { keys, values };
  }

  /**
   * Create Sparkplug property value
   */
  private createPropertyValue(value: unknown): SparkplugPropertyValue {
    if (typeof value === 'boolean') {
      return {
        type: SparkplugMetricDataType.Boolean,
        booleanValue: value,
      };
    } else if (typeof value === 'number') {
      return {
        type: SparkplugMetricDataType.Double,
        doubleValue: value,
      };
    } else {
      return {
        type: SparkplugMetricDataType.String,
        stringValue: String(value),
      };
    }
  }

  /**
   * Get next sequence number (0-255, wraps around)
   */
  private getNextSequenceNumber(): number {
    const seq = this.sequenceNumber;
    this.sequenceNumber = (this.sequenceNumber + 1) % this.MAX_SEQ;
    return seq;
  }

  /**
   * Reset sequence number (call on NBIRTH)
   */
  resetSequence(): void {
    this.sequenceNumber = 0;
  }
}

/**
 * Protocol-specific normalization helpers
 */
export class ProtocolNormalizationHelpers {
  /**
   * Normalize Modbus address to standard format
   */
  static normalizeModbusAddress(
    functionCode: number,
    address: number,
    slaveId: number = 1
  ): string {
    return `${slaveId}:${functionCode}:${address}`;
  }

  /**
   * Normalize OPC UA NodeId to standard format
   */
  static normalizeOpcUaNodeId(namespaceIndex: number, identifier: string | number): string {
    return `ns=${namespaceIndex};${typeof identifier === 'number' ? 'i' : 's'}=${identifier}`;
  }

  /**
   * Normalize MQTT topic to data point name
   */
  static normalizeMqttTopic(topic: string, deviceId: string): string {
    // Remove device ID prefix if present
    return topic.replace(`${deviceId}/`, '').replace(/\//g, '.');
  }

  /**
   * Extract device ID from LoRaWAN DevEUI
   */
  static normalizeLoRaWANDeviceId(devEUI: string): string {
    return `lorawan_${devEUI.toLowerCase().replace(/:/g, '')}`;
  }

  /**
   * Normalize GSM IMEI to device ID
   */
  static normalizeGSMDeviceId(imei: string): string {
    return `gsm_${imei}`;
  }
}
