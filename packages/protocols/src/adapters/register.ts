/**
 * Protocol Adapter Registration
 *
 * Register all protocol adapters with the protocol registry
 */

import { ProtocolType } from '../abstraction';
import { ProtocolRegistry } from '../registry';
import { ModbusRTUAdapter } from './modbus-rtu.adapter';
import { ModbusTCPAdapter } from './modbus-tcp.adapter';

/**
 * Register all available protocol adapters
 */
export function registerAllProtocols(): void {
  const registry = ProtocolRegistry.getInstance();

  // Register Modbus TCP
  registry.register(
    {
      name: 'Modbus TCP',
      protocol: ProtocolType.MODBUS_TCP,
      version: '1.0.0',
      description: 'Modbus TCP protocol adapter with bulk read optimization',
      author: 'WebSCADA Team',
      capabilities: new ModbusTCPAdapter().getCapabilities(),
    },
    () => new ModbusTCPAdapter()
  );

  // Register Modbus RTU
  registry.register(
    {
      name: 'Modbus RTU',
      protocol: ProtocolType.MODBUS_RTU,
      version: '1.0.0',
      description: 'Modbus RTU protocol adapter for serial communication',
      author: 'WebSCADA Team',
      capabilities: new ModbusRTUAdapter().getCapabilities(),
    },
    () => new ModbusRTUAdapter()
  );

  console.log('[ProtocolRegistry] All protocol adapters registered successfully');
}

/**
 * Register individual protocol adapters
 */
export function registerModbusTCP(): void {
  const registry = ProtocolRegistry.getInstance();
  registry.register(
    {
      name: 'Modbus TCP',
      protocol: ProtocolType.MODBUS_TCP,
      version: '1.0.0',
      description: 'Modbus TCP protocol adapter',
      capabilities: new ModbusTCPAdapter().getCapabilities(),
    },
    () => new ModbusTCPAdapter()
  );
}

export function registerModbusRTU(): void {
  const registry = ProtocolRegistry.getInstance();
  registry.register(
    {
      name: 'Modbus RTU',
      protocol: ProtocolType.MODBUS_RTU,
      version: '1.0.0',
      description: 'Modbus RTU protocol adapter',
      capabilities: new ModbusRTUAdapter().getCapabilities(),
    },
    () => new ModbusRTUAdapter()
  );
}
