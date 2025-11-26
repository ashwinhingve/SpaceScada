# Protocol Adapter Development Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-27

This guide explains how to create a new protocol adapter using the WebSCADA Protocol Abstraction Layer (PAL).

---

## Quick Start

### Step 1: Create Adapter Class

```typescript
// packages/protocols/src/adapters/my-protocol.adapter.ts

import {
  BaseProtocolAdapter,
  ConnectionConfig,
  DataPoint,
  DataType,
  DataQuality,
  ProtocolCapabilities,
} from '../abstraction';

export class MyProtocolAdapter extends BaseProtocolAdapter {
  private client?: MyProtocolClient;

  /**
   * Define protocol capabilities
   */
  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRead: true,
      supportsWrite: true,
      supportsSubscribe: false, // Change to true if your protocol supports subscriptions
      supportsBulkOperations: true,
      supportsDiscovery: false,
      maxConcurrentConnections: 10,
      reconnectionSupported: true,
    };
  }

  /**
   * Connect to device/network
   */
  protected async doConnect(config: ConnectionConfig): Promise<void> {
    this.client = new MyProtocolClient({
      host: config.host!,
      port: config.port!,
      timeout: config.timeout || 5000,
    });

    await this.client.connect();
    console.log(`Connected to ${config.host}:${config.port}`);
  }

  /**
   * Disconnect from device/network
   */
  protected async doDisconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = undefined;
    }
  }

  /**
   * Read single data point
   */
  protected async doRead(address: string): Promise<DataPoint> {
    if (!this.client) {
      throw new Error('Not connected');
    }

    // Protocol-specific address parsing
    const { register, dataType } = this.parseAddress(address);

    // Read from device
    const rawValue = await this.client.readRegister(register);

    // Convert to DataPoint
    return {
      address,
      name: this.getTagName(address),
      value: this.convertValue(rawValue, dataType),
      dataType,
      quality: DataQuality.GOOD,
      timestamp: Date.now(),
    };
  }

  /**
   * Write single data point
   */
  protected async doWrite(address: string, value: unknown): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected');
    }

    const { register } = this.parseAddress(address);
    await this.client.writeRegister(register, value);
  }

  /**
   * Parse protocol-specific address
   */
  private parseAddress(address: string): { register: number; dataType: DataType } {
    // Example: "40001:FLOAT" -> register 40001, type FLOAT
    const [registerStr, typeStr] = address.split(':');
    return {
      register: parseInt(registerStr),
      dataType: this.parseDataType(typeStr),
    };
  }

  private parseDataType(typeStr: string): DataType {
    const mapping: Record<string, DataType> = {
      INT16: DataType.INT16,
      INT32: DataType.INT32,
      FLOAT: DataType.FLOAT,
      DOUBLE: DataType.DOUBLE,
      BOOL: DataType.BOOLEAN,
    };
    return mapping[typeStr] || DataType.INT16;
  }

  private getTagName(address: string): string {
    // Generate human-readable name from address
    return `tag_${address.replace(':', '_')}`;
  }

  private convertValue(rawValue: unknown, dataType: DataType): unknown {
    // Convert raw value to appropriate type
    switch (dataType) {
      case DataType.BOOLEAN:
        return Boolean(rawValue);
      case DataType.FLOAT:
      case DataType.DOUBLE:
        return parseFloat(String(rawValue));
      default:
        return parseInt(String(rawValue));
    }
  }
}
```

### Step 2: Register Plugin

```typescript
// packages/protocols/src/adapters/index.ts

import { ProtocolRegistry, ProtocolType } from '../registry';
import { MyProtocolAdapter } from './my-protocol.adapter';

export function registerMyProtocol(): void {
  const registry = ProtocolRegistry.getInstance();

  registry.register(
    {
      name: 'My Protocol',
      protocol: ProtocolType.MY_PROTOCOL, // Add this to ProtocolType enum
      version: '1.0.0',
      description: 'Custom protocol adapter for My Protocol devices',
      author: 'Your Name',
      capabilities: new MyProtocolAdapter().getCapabilities(),
    },
    () => new MyProtocolAdapter()
  );
}
```

### Step 3: Use in Gateway Service

```typescript
// apps/gateway-service/src/index.ts

import { registerMyProtocol } from '@webscada/protocols/adapters';
import { ProtocolRegistry } from '@webscada/protocols/registry';
import { SparkplugNormalizer } from '@webscada/protocols/normalization';

// Register all protocols
registerMyProtocol();

// Use the adapter
const registry = ProtocolRegistry.getInstance();
const adapter = registry.createAdapter(ProtocolType.MY_PROTOCOL, 'device-001');

await adapter.connect({
  protocol: ProtocolType.MY_PROTOCOL,
  host: '192.168.1.100',
  port: 5020,
});

// Read data
const dataPoint = await adapter.read('40001:FLOAT');

// Normalize to Sparkplug B
const normalizer = new SparkplugNormalizer();
const message = normalizer.createTelemetryMessage(
  ProtocolType.MY_PROTOCOL,
  'gateway-001',
  'plant-1',
  'edge-node-1',
  'device-001',
  [dataPoint],
  'DDATA'
);

// Publish to MQTT
await mqttPublish(message);
```

---

## Advanced Features

### Implementing Subscriptions

If your protocol supports data change notifications:

```typescript
export class MyProtocolAdapter extends BaseProtocolAdapter {
  private subscriptions = new Map<string, SubscriptionInfo>();

  async subscribe(
    addresses: string[],
    callback: DataCallback,
    errorCallback?: ErrorCallback,
    options?: SubscriptionOptions
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();

    // Start polling or register callbacks
    const interval = setInterval(async () => {
      for (const address of addresses) {
        try {
          const dataPoint = await this.read(address);

          // Apply dead-band filtering if specified
          if (options?.deadband && !this.exceedsDeadband(dataPoint, options.deadband)) {
            continue;
          }

          callback(dataPoint);
        } catch (error) {
          errorCallback?.(error as Error);
        }
      }
    }, options?.sampleRate || 1000);

    this.subscriptions.set(subscriptionId, {
      addresses,
      callback,
      interval,
    });

    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      clearInterval(subscription.interval);
      this.subscriptions.delete(subscriptionId);
    }
  }

  private exceedsDeadband(dataPoint: DataPoint, deadband: number): boolean {
    // Implement dead-band logic
    // Only return true if value changed by more than deadband
    return true;
  }
}
```

### Implementing Device Discovery

For protocols that support network scanning:

```typescript
export class MyProtocolAdapter extends BaseProtocolAdapter {
  async discoverDevices(): Promise<DeviceDiscovery[]> {
    if (!this.client) {
      throw new Error('Not connected');
    }

    // Scan network for devices
    const devices = await this.client.scanNetwork();

    return devices.map((device) => ({
      deviceId: device.id,
      protocol: ProtocolType.MY_PROTOCOL,
      address: device.address,
      capabilities: device.supportedFeatures,
      metadata: {
        manufacturer: device.manufacturer,
        model: device.model,
        firmwareVersion: device.firmware,
      },
    }));
  }
}
```

### Bulk Read Optimization

Override `readBulk()` for efficient batch operations:

```typescript
export class MyProtocolAdapter extends BaseProtocolAdapter {
  async readBulk(request: BulkReadRequest): Promise<BulkReadResponse> {
    if (!this.client) {
      throw new Error('Not connected');
    }

    const dataPoints = new Map<string, DataPoint>();
    const errors = new Map<string, Error>();

    // Group addresses by register blocks for efficient reading
    const blocks = this.groupIntoBlocks(request.addresses);

    for (const block of blocks) {
      try {
        const values = await this.client.readRegisterBlock(block.startRegister, block.count);

        // Map values back to addresses
        block.addresses.forEach((address, index) => {
          dataPoints.set(address, {
            address,
            name: this.getTagName(address),
            value: values[index],
            dataType: block.dataType,
            quality: DataQuality.GOOD,
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        block.addresses.forEach((address) => {
          errors.set(address, error as Error);
        });
      }
    }

    return { dataPoints, errors };
  }

  private groupIntoBlocks(addresses: string[]): RegisterBlock[] {
    // Group contiguous addresses into blocks
    // This is protocol-specific optimization
    return [];
  }
}
```

---

## Testing Your Adapter

### Unit Tests

```typescript
// packages/protocols/src/adapters/__tests__/my-protocol.adapter.test.ts

import { MyProtocolAdapter } from '../my-protocol.adapter';
import { ProtocolType, DataQuality } from '../../abstraction';

describe('MyProtocolAdapter', () => {
  let adapter: MyProtocolAdapter;

  beforeEach(() => {
    adapter = new MyProtocolAdapter();
  });

  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await adapter.connect({
        protocol: ProtocolType.MY_PROTOCOL,
        host: 'localhost',
        port: 5020,
      });

      expect(adapter.isConnected()).toBe(true);
    });

    it('should throw error on invalid host', async () => {
      await expect(
        adapter.connect({
          protocol: ProtocolType.MY_PROTOCOL,
          host: 'invalid-host',
          port: 5020,
        })
      ).rejects.toThrow();
    });
  });

  describe('read', () => {
    beforeEach(async () => {
      await adapter.connect({
        protocol: ProtocolType.MY_PROTOCOL,
        host: 'localhost',
        port: 5020,
      });
    });

    it('should read data point', async () => {
      const dataPoint = await adapter.read('40001:FLOAT');

      expect(dataPoint).toMatchObject({
        address: '40001:FLOAT',
        quality: DataQuality.GOOD,
      });
      expect(typeof dataPoint.value).toBe('number');
      expect(dataPoint.timestamp).toBeGreaterThan(0);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities();

      expect(capabilities).toMatchObject({
        supportsRead: true,
        supportsWrite: true,
        reconnectionSupported: true,
      });
    });
  });
});
```

### Integration Tests

```typescript
// apps/gateway-service/src/__tests__/protocol-integration.test.ts

import { ProtocolRegistry } from '@webscada/protocols/registry';
import { SparkplugNormalizer } from '@webscada/protocols/normalization';
import { registerMyProtocol } from '@webscada/protocols/adapters';

describe('Protocol Integration', () => {
  let registry: ProtocolRegistry;
  let normalizer: SparkplugNormalizer;

  beforeAll(() => {
    registry = ProtocolRegistry.getInstance();
    registerMyProtocol();
    normalizer = new SparkplugNormalizer();
  });

  it('should create adapter and normalize data', async () => {
    const adapter = registry.createAdapter(ProtocolType.MY_PROTOCOL);

    await adapter.connect({
      protocol: ProtocolType.MY_PROTOCOL,
      host: 'simulator',
      port: 5020,
    });

    const dataPoint = await adapter.read('40001:FLOAT');
    expect(dataPoint).toBeDefined();

    const message = normalizer.createTelemetryMessage(
      ProtocolType.MY_PROTOCOL,
      'test-gateway',
      'test-group',
      'test-node',
      'test-device',
      [dataPoint],
      'DDATA'
    );

    expect(message.messageType).toBe('DDATA');
    expect(message.payload.metrics).toHaveLength(1);
    expect(message.payload.metrics[0].name).toBe(dataPoint.name);

    await adapter.disconnect();
  });
});
```

---

## Best Practices

### 1. Error Handling

Always provide meaningful error messages:

```typescript
protected async doRead(address: string): Promise<DataPoint> {
  if (!this.client) {
    throw new Error('Adapter not connected. Call connect() first.');
  }

  try {
    const { register } = this.parseAddress(address);
    const value = await this.client.readRegister(register);
    return this.createDataPoint(address, value);
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      throw new Error(`Read timeout for address ${address}`);
    } else if (error.code === 'INVALID_ADDRESS') {
      throw new Error(`Invalid address format: ${address}`);
    }
    throw error;
  }
}
```

### 2. Logging

Use structured logging:

```typescript
import { createLogger } from '@webscada/utils';

export class MyProtocolAdapter extends BaseProtocolAdapter {
  private logger = createLogger('MyProtocolAdapter');

  protected async doConnect(config: ConnectionConfig): Promise<void> {
    this.logger.info('Connecting', {
      host: config.host,
      port: config.port,
      protocol: config.protocol,
    });

    // ... connection logic

    this.logger.info('Connected successfully', {
      host: config.host,
      connectionTime: Date.now() - startTime,
    });
  }
}
```

### 3. Configuration Validation

Validate configuration early:

```typescript
protected async doConnect(config: ConnectionConfig): Promise<void> {
  // Validate required fields
  if (!config.host) {
    throw new Error('Host is required');
  }
  if (!config.port || config.port < 1 || config.port > 65535) {
    throw new Error('Valid port number is required (1-65535)');
  }

  // Validate protocol-specific options
  if (config.options?.slaveId && (config.options.slaveId < 1 || config.options.slaveId > 247)) {
    throw new Error('Invalid Modbus slave ID (1-247)');
  }

  // ... connection logic
}
```

### 4. Resource Cleanup

Always clean up resources:

```typescript
protected async doDisconnect(): Promise<void> {
  // Clear all subscriptions
  for (const [id, subscription] of this.subscriptions) {
    clearInterval(subscription.interval);
  }
  this.subscriptions.clear();

  // Close client connection
  if (this.client) {
    await this.client.disconnect();
    this.client = undefined;
  }

  this.logger.info('Disconnected and cleaned up resources');
}
```

### 5. Reconnection Logic

Implement automatic reconnection:

```typescript
private async reconnect(): Promise<void> {
  if (!this.config) {
    return;
  }

  const maxRetries = this.config.retries || 5;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      this.logger.info(`Reconnection attempt ${attempt}/${maxRetries}`);
      await this.doConnect(this.config);
      this.logger.info('Reconnected successfully');
      return;
    } catch (error) {
      this.logger.warn(`Reconnection attempt ${attempt} failed`, { error });
      if (attempt < maxRetries) {
        await this.sleep(retryDelay * attempt);
      }
    }
  }

  throw new Error(`Failed to reconnect after ${maxRetries} attempts`);
}

private sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

## Protocol-Specific Examples

### Modbus TCP

See: `packages/protocols/src/adapters/modbus-tcp.adapter.ts`

Key features:

- Function code support (1-6, 15-16)
- Register address parsing (coils, discrete inputs, holding registers, input registers)
- Bulk read optimization
- Multiple slave support

### OPC UA

See: `packages/protocols/src/adapters/opcua.adapter.ts`

Key features:

- Node browsing
- Subscription-based data change notifications
- Security modes (None, Sign, SignAndEncrypt)
- Historical data access

### MQTT Sparkplug B

See: `packages/protocols/src/adapters/mqtt-sparkplug.adapter.ts`

Key features:

- NBIRTH/DBIRTH message handling
- Metric aliases
- Birth/Death sequence numbers
- Command handling (NCMD/DCMD)

---

## Troubleshooting

### Common Issues

1. **"Not connected" errors**
   - Always check `isConnected()` before operations
   - Implement reconnection logic

2. **Timeout errors**
   - Increase timeout in ConnectionConfig
   - Check network connectivity
   - Verify device is responding

3. **Invalid address format**
   - Document your address format clearly
   - Validate addresses early
   - Provide helpful error messages

4. **Memory leaks**
   - Clear subscriptions on disconnect
   - Clean up timers and intervals
   - Close client connections properly

---

## Additional Resources

- [Protocol Abstraction Layer API](./abstraction/protocol-adapter.interface.ts)
- [Sparkplug B Normalization](./normalization/sparkplug-normalizer.ts)
- [Protocol Registry](./registry/protocol-registry.ts)
- [Multi-Protocol Architecture](../architecture/multi-protocol-architecture.md)

---

**Need Help?**

- Review existing adapters in `packages/protocols/src/adapters/`
- Check unit tests for examples
- Consult the architecture documentation

**Contributing:**

Submit your protocol adapter as a pull request with:

- Complete implementation
- Unit tests (>80% coverage)
- Integration tests
- Documentation
- Example usage
