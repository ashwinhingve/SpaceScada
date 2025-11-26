/**
 * Complete Modbus TCP Example
 *
 * This example demonstrates the full multi-protocol architecture:
 * 1. Protocol Registry - Dynamic adapter management
 * 2. Protocol Adapter - Modbus TCP connection and data read/write
 * 3. Sparkplug B Normalizer - Convert Modbus data to unified format
 * 4. MQTT Publishing - Send normalized data to cloud
 *
 * Usage:
 *   tsx examples/modbus-complete-example.ts
 */

import { registerAllProtocols } from '../src/adapters';
import { ProtocolRegistry } from '../src/registry';
import { ProtocolType } from '../src/abstraction';
import { SparkplugNormalizer } from '../src/normalization';

async function main() {
  console.log('='.repeat(60));
  console.log('WebSCADA Multi-Protocol Architecture Demo');
  console.log('Modbus TCP → Sparkplug B Normalization');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Register all protocol adapters
  console.log('[Step 1] Registering protocol adapters...');
  registerAllProtocols();

  const registry = ProtocolRegistry.getInstance();
  const plugins = registry.listPluginMetadata();
  console.log(`✓ Registered ${plugins.length} protocol adapters:`);
  plugins.forEach((plugin) => {
    console.log(`  - ${plugin.name} v${plugin.version}`);
  });
  console.log();

  // Step 2: Create Modbus TCP adapter instance
  console.log('[Step 2] Creating Modbus TCP adapter...');
  const adapter = registry.createAdapter(ProtocolType.MODBUS_TCP, 'plc-001');
  console.log('✓ Adapter created: plc-001');
  console.log();

  // Step 3: Connect to Modbus TCP device
  console.log('[Step 3] Connecting to Modbus TCP device...');
  try {
    await adapter.connect({
      protocol: ProtocolType.MODBUS_TCP,
      host: 'localhost', // Replace with your PLC IP
      port: 502,
      timeout: 5000,
      options: {
        defaultSlaveId: 1,
      },
    });
    console.log('✓ Connected successfully');
    console.log();
  } catch (error) {
    console.error('✗ Connection failed:', (error as Error).message);
    console.log('Note: Make sure a Modbus TCP server is running on localhost:502');
    console.log('You can use the simulator: cd apps/simulator && pnpm dev');
    process.exit(1);
  }

  // Step 4: Read data from Modbus device
  console.log('[Step 4] Reading data from Modbus device...');

  // Define data points to read
  const dataPoints = [
    '1:3:40001:FLOAT', // Slave 1, Holding Register 40001, Float (Temperature)
    '1:3:40003:FLOAT', // Slave 1, Holding Register 40003, Float (Pressure)
    '1:3:40005:INT16', // Slave 1, Holding Register 40005, Int16 (Status)
    '1:1:10001:BOOL', // Slave 1, Coil 10001, Boolean (Pump Running)
  ];

  const readResults = [];
  for (const address of dataPoints) {
    try {
      const dataPoint = await adapter.read(address);
      readResults.push(dataPoint);
      console.log(`✓ Read ${dataPoint.name}:`);
      console.log(`  Address: ${dataPoint.address}`);
      console.log(`  Value: ${dataPoint.value}`);
      console.log(`  Type: ${dataPoint.dataType}`);
      console.log(`  Quality: ${dataPoint.quality}`);
      console.log();
    } catch (error) {
      console.error(`✗ Failed to read ${address}:`, (error as Error).message);
    }
  }

  // Step 5: Bulk read optimization
  console.log('[Step 5] Performing bulk read...');
  try {
    const bulkResult = await adapter.readBulk({
      addresses: dataPoints,
      timeout: 10000,
    });

    console.log(`✓ Bulk read completed:`);
    console.log(`  Success: ${bulkResult.dataPoints.size} data points`);
    console.log(`  Errors: ${bulkResult.errors.size}`);
    console.log();
  } catch (error) {
    console.error('✗ Bulk read failed:', (error as Error).message);
  }

  // Step 6: Write data to Modbus device
  console.log('[Step 6] Writing data to Modbus device...');
  try {
    await adapter.write('1:5:10001:BOOL', true); // Turn on pump
    console.log('✓ Write successful: Pump turned ON');
    console.log();
  } catch (error) {
    console.error('✗ Write failed:', (error as Error).message);
  }

  // Step 7: Normalize data to Sparkplug B
  console.log('[Step 7] Normalizing data to Sparkplug B format...');
  const normalizer = new SparkplugNormalizer();

  const normalizedMessage = normalizer.createTelemetryMessage(
    ProtocolType.MODBUS_TCP,
    'gateway-001', // Gateway ID
    'plant-1', // Group ID
    'edge-node-1', // Edge Node ID
    'plc-001', // Device ID
    readResults, // Data points
    'DDATA' // Message type
  );

  console.log('✓ Data normalized to Sparkplug B:');
  console.log(`  Message Type: ${normalizedMessage.messageType}`);
  console.log(`  Group ID: ${normalizedMessage.groupId}`);
  console.log(`  Edge Node: ${normalizedMessage.edgeNodeId}`);
  console.log(`  Device ID: ${normalizedMessage.deviceId}`);
  console.log(`  Sequence: ${normalizedMessage.payload.seq}`);
  console.log(`  Metrics: ${normalizedMessage.payload.metrics.length}`);
  console.log();

  console.log('  Metrics Details:');
  normalizedMessage.payload.metrics.forEach((metric, index) => {
    console.log(`  ${index + 1}. ${metric.name}:`);
    console.log(`     Type: ${metric.dataType}`);
    console.log(`     Value: ${JSON.stringify(metric)}`);
  });
  console.log();

  // Step 8: Sparkplug B MQTT topic and payload
  console.log('[Step 8] Generating MQTT publish command...');
  const topic = `spBv1.0/${normalizedMessage.groupId}/${normalizedMessage.messageType}/${normalizedMessage.edgeNodeId}/${normalizedMessage.deviceId}`;
  const payload = JSON.stringify(normalizedMessage.payload, null, 2);

  console.log('✓ MQTT Publish:');
  console.log(`  Topic: ${topic}`);
  console.log(`  Payload:`);
  console.log(payload);
  console.log();

  // Step 9: Adapter health metrics
  console.log('[Step 9] Adapter health metrics...');
  const health = adapter.getHealth();
  console.log('✓ Health Status:');
  console.log(`  Healthy: ${health.isHealthy}`);
  console.log(`  Uptime: ${(health.uptime / 1000).toFixed(2)}s`);
  console.log(`  Total Reads: ${health.totalReads}`);
  console.log(`  Failed Reads: ${health.failedReads}`);
  console.log(`  Avg Read Latency: ${health.avgReadLatency.toFixed(2)}ms`);
  console.log(`  Total Writes: ${health.totalWrites}`);
  console.log(`  Failed Writes: ${health.failedWrites}`);
  console.log(`  Avg Write Latency: ${health.avgWriteLatency.toFixed(2)}ms`);
  console.log();

  // Step 10: Device discovery
  console.log('[Step 10] Discovering Modbus devices...');
  console.log('(Scanning slave IDs 1-247, this may take a while...)');
  try {
    const devices = await adapter.discoverDevices();
    console.log(`✓ Found ${devices.length} Modbus devices:`);
    devices.forEach((device) => {
      console.log(`  - ${device.deviceId} (Slave ID: ${device.address})`);
    });
    console.log();
  } catch (error) {
    console.error('✗ Discovery failed:', (error as Error).message);
  }

  // Step 11: Protocol registry statistics
  console.log('[Step 11] Protocol registry statistics...');
  const stats = registry.getAllStatistics();
  console.log('✓ Registry Statistics:');
  stats.forEach((stat) => {
    console.log(`  ${stat.protocol}:`);
    console.log(`    Version: ${stat.version}`);
    console.log(`    Instances: ${stat.instanceCount}`);
    console.log(`    Uptime: ${(stat.uptime / 1000).toFixed(2)}s`);
    console.log(`    Last Used: ${new Date(stat.lastUsed).toLocaleTimeString()}`);
  });
  console.log();

  // Step 12: Cleanup
  console.log('[Step 12] Cleaning up...');
  await adapter.disconnect();
  console.log('✓ Disconnected from Modbus device');
  console.log();

  console.log('='.repeat(60));
  console.log('Demo completed successfully!');
  console.log('='.repeat(60));
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
