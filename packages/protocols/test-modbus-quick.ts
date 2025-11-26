/**
 * Quick Modbus TCP Test
 *
 * Tests the new Modbus adapter with the running simulator
 */

import { registerAllProtocols, ProtocolRegistry, ProtocolType, SparkplugNormalizer } from './src';

async function quickTest() {
  console.log('🚀 Quick Modbus TCP Test\n');

  // Step 1: Register protocols
  console.log('[1/5] Registering protocols...');
  registerAllProtocols();
  console.log('✓ Protocols registered\n');

  // Step 2: Create adapter
  console.log('[2/5] Creating Modbus TCP adapter...');
  const registry = ProtocolRegistry.getInstance();
  const adapter = registry.createAdapter(ProtocolType.MODBUS_TCP, 'test-plc');
  console.log('✓ Adapter created\n');

  // Step 3: Connect to simulator
  console.log('[3/5] Connecting to Modbus simulator at localhost:5020...');
  try {
    await adapter.connect({
      protocol: ProtocolType.MODBUS_TCP,
      host: 'localhost',
      port: 5020,
      timeout: 5000,
    });
    console.log('✓ Connected successfully\n');
  } catch (error) {
    console.error('✗ Connection failed:', (error as Error).message);
    process.exit(1);
  }

  // Step 4: Read data
  console.log('[4/5] Reading data from Modbus device...');
  try {
    const dataPoint = await adapter.read('1:3:0:FLOAT'); // Slave 1, Holding Register 0, Float
    console.log('✓ Read successful:');
    console.log('  Address:', dataPoint.address);
    console.log('  Value:', dataPoint.value);
    console.log('  Type:', dataPoint.dataType);
    console.log('  Quality:', dataPoint.quality);
    console.log();
  } catch (error) {
    console.error('✗ Read failed:', (error as Error).message);
  }

  // Step 5: Normalize to Sparkplug B
  console.log('[5/5] Normalizing to Sparkplug B...');
  const normalizer = new SparkplugNormalizer();
  const dataPoint = await adapter.read('1:3:0:FLOAT');

  const message = normalizer.createTelemetryMessage(
    ProtocolType.MODBUS_TCP,
    'test-gateway',
    'test-group',
    'test-node',
    'test-plc',
    [dataPoint],
    'DDATA'
  );

  console.log('✓ Normalized message:');
  console.log('  Type:', message.messageType);
  console.log('  Metrics:', message.payload.metrics.length);
  console.log('  Topic: spBv1.0/test-group/DDATA/test-node/test-plc');
  console.log();

  // Cleanup
  await adapter.disconnect();
  console.log('✓ Disconnected\n');

  console.log('🎉 All tests passed!');
}

quickTest().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
