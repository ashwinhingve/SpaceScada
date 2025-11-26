/**
 * Modbus TCP Protocol Adapter
 *
 * Production-ready implementation of Modbus TCP using modbus-serial library.
 * Supports function codes 1-6, 15-16 with bulk read optimization.
 */

import ModbusRTU from 'modbus-serial';

import {
  BaseProtocolAdapter,
  ConnectionConfig,
  DataPoint,
  DataType,
  DataQuality,
  ProtocolCapabilities,
  BulkReadRequest,
  BulkReadResponse,
  DeviceDiscovery,
  ProtocolType,
} from '../abstraction';

/**
 * Modbus address format: {slaveId}:{functionCode}:{address}
 * Examples:
 *   "1:3:40001" - Slave 1, Read Holding Registers (FC3), Register 40001
 *   "1:4:30001" - Slave 1, Read Input Registers (FC4), Register 30001
 *   "1:1:10001" - Slave 1, Read Coils (FC1), Coil 10001
 */

interface ModbusAddress {
  slaveId: number;
  functionCode: number;
  address: number;
  dataType: DataType;
  count?: number; // For bulk reads
}

export interface ModbusTCPConfig extends ConnectionConfig {
  host: string;
  port?: number;
  timeout?: number;
  retries?: number;
  options?: {
    defaultSlaveId?: number;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
  };
}

/**
 * Modbus TCP Adapter
 */
export class ModbusTCPAdapter extends BaseProtocolAdapter {
  private client: ModbusRTU;
  private reconnectTimer?: NodeJS.Timeout;
  private defaultSlaveId: number = 1;

  constructor() {
    super();
    this.client = new ModbusRTU();
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRead: true,
      supportsWrite: true,
      supportsSubscribe: false, // Modbus is poll-based
      supportsBulkOperations: true,
      supportsDiscovery: true, // Can scan slave IDs
      maxConcurrentConnections: 1, // Modbus is serial protocol
      reconnectionSupported: true,
    };
  }

  protected async doConnect(config: ConnectionConfig): Promise<void> {
    const modbusConfig = config as ModbusTCPConfig;

    if (!modbusConfig.host) {
      throw new Error('Modbus TCP requires host parameter');
    }

    const port = modbusConfig.port || 502;
    const timeout = modbusConfig.timeout || 5000;

    this.defaultSlaveId = modbusConfig.options?.defaultSlaveId || 1;

    // Set timeout
    this.client.setTimeout(timeout);

    // Connect to Modbus TCP server
    await this.client.connectTCP(modbusConfig.host, { port });

    // Set default slave ID
    this.client.setID(this.defaultSlaveId);

    console.log(
      `[ModbusTCP] Connected to ${modbusConfig.host}:${port}, Slave ID: ${this.defaultSlaveId}`
    );
  }

  protected async doDisconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.client.close(() => {
      console.log('[ModbusTCP] Disconnected');
    });
  }

  protected async doRead(address: string): Promise<DataPoint> {
    const parsedAddress = this.parseAddress(address);

    // Set slave ID if different from default
    if (parsedAddress.slaveId !== this.defaultSlaveId) {
      this.client.setID(parsedAddress.slaveId);
    }

    let value: unknown;
    const timestamp = Date.now();

    try {
      switch (parsedAddress.functionCode) {
        case 1: // Read Coils
          {
            const result = await this.client.readCoils(
              parsedAddress.address,
              parsedAddress.count || 1
            );
            value = result.data[0];
          }
          break;

        case 2: // Read Discrete Inputs
          {
            const result = await this.client.readDiscreteInputs(
              parsedAddress.address,
              parsedAddress.count || 1
            );
            value = result.data[0];
          }
          break;

        case 3: // Read Holding Registers
          {
            const result = await this.client.readHoldingRegisters(
              parsedAddress.address,
              parsedAddress.count || 1
            );
            value = this.convertRegisterValue(result.buffer, parsedAddress.dataType);
          }
          break;

        case 4: // Read Input Registers
          {
            const result = await this.client.readInputRegisters(
              parsedAddress.address,
              parsedAddress.count || 1
            );
            value = this.convertRegisterValue(result.buffer, parsedAddress.dataType);
          }
          break;

        default:
          throw new Error(`Unsupported function code: ${parsedAddress.functionCode}`);
      }

      return {
        address,
        name: this.generateTagName(parsedAddress),
        value,
        dataType: parsedAddress.dataType,
        quality: DataQuality.GOOD,
        timestamp,
      };
    } catch (error) {
      console.error(`[ModbusTCP] Read error for ${address}:`, error);
      return {
        address,
        name: this.generateTagName(parsedAddress),
        value: null,
        dataType: parsedAddress.dataType,
        quality: DataQuality.BAD,
        timestamp,
        metadata: {
          error: (error as Error).message,
        },
      };
    } finally {
      // Reset to default slave ID
      if (parsedAddress.slaveId !== this.defaultSlaveId) {
        this.client.setID(this.defaultSlaveId);
      }
    }
  }

  protected async doWrite(address: string, value: unknown): Promise<void> {
    const parsedAddress = this.parseAddress(address);

    // Set slave ID if different from default
    if (parsedAddress.slaveId !== this.defaultSlaveId) {
      this.client.setID(parsedAddress.slaveId);
    }

    try {
      switch (parsedAddress.functionCode) {
        case 5: // Write Single Coil
          await this.client.writeCoil(parsedAddress.address, Boolean(value));
          break;

        case 6: // Write Single Register
          {
            const registerValue = this.valueToRegister(value, parsedAddress.dataType);
            await this.client.writeRegister(parsedAddress.address, registerValue);
          }
          break;

        case 15: // Write Multiple Coils
          {
            const coils = Array.isArray(value) ? value.map(Boolean) : [Boolean(value)];
            await this.client.writeCoils(parsedAddress.address, coils);
          }
          break;

        case 16: // Write Multiple Registers
          {
            const registers = Array.isArray(value)
              ? value.map((v) => this.valueToRegister(v, parsedAddress.dataType))
              : [this.valueToRegister(value, parsedAddress.dataType)];
            await this.client.writeRegisters(parsedAddress.address, registers);
          }
          break;

        default:
          throw new Error(
            `Unsupported write function code: ${parsedAddress.functionCode}. Use 5, 6, 15, or 16.`
          );
      }

      console.log(`[ModbusTCP] Write successful: ${address} = ${value}`);
    } catch (error) {
      console.error(`[ModbusTCP] Write error for ${address}:`, error);
      throw error;
    } finally {
      // Reset to default slave ID
      if (parsedAddress.slaveId !== this.defaultSlaveId) {
        this.client.setID(this.defaultSlaveId);
      }
    }
  }

  /**
   * Optimized bulk read for contiguous register blocks
   */
  async readBulk(request: BulkReadRequest): Promise<BulkReadResponse> {
    const dataPoints = new Map<string, DataPoint>();
    const errors = new Map<string, Error>();

    // Group addresses by slave ID and register type
    const groups = this.groupAddressesForBulkRead(request.addresses);

    for (const group of groups) {
      try {
        // Set slave ID
        this.client.setID(group.slaveId);

        // Read entire block
        let result: any;
        switch (group.functionCode) {
          case 1:
            result = await this.client.readCoils(group.startAddress, group.count);
            break;
          case 2:
            result = await this.client.readDiscreteInputs(group.startAddress, group.count);
            break;
          case 3:
            result = await this.client.readHoldingRegisters(group.startAddress, group.count);
            break;
          case 4:
            result = await this.client.readInputRegisters(group.startAddress, group.count);
            break;
          default:
            throw new Error(`Unsupported function code: ${group.functionCode}`);
        }

        // Map results back to addresses
        group.addresses.forEach((addr, index) => {
          const parsedAddr = this.parseAddress(addr);
          let value: unknown;

          if (group.functionCode === 1 || group.functionCode === 2) {
            // Coils/Discrete Inputs
            value = result.data[index];
          } else {
            // Registers
            const offset = index * this.getRegisterCount(parsedAddr.dataType);
            const buffer = result.buffer.slice(offset * 2, (offset + parsedAddr.count!) * 2);
            value = this.convertRegisterValue(buffer, parsedAddr.dataType);
          }

          dataPoints.set(addr, {
            address: addr,
            name: this.generateTagName(parsedAddr),
            value,
            dataType: parsedAddr.dataType,
            quality: DataQuality.GOOD,
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        // Mark all addresses in this group as failed
        group.addresses.forEach((addr) => {
          errors.set(addr, error as Error);
        });
      }
    }

    return { dataPoints, errors };
  }

  /**
   * Discover Modbus slave devices on the network
   */
  async discoverDevices(): Promise<DeviceDiscovery[]> {
    const devices: DeviceDiscovery[] = [];
    const maxSlaveId = 247; // Modbus valid range: 1-247

    console.log('[ModbusTCP] Starting device discovery...');

    for (let slaveId = 1; slaveId <= maxSlaveId; slaveId++) {
      try {
        this.client.setID(slaveId);

        // Try to read a single coil (most basic operation)
        await this.client.readCoils(0, 1);

        devices.push({
          deviceId: `modbus_tcp_slave_${slaveId}`,
          protocol: ProtocolType.MODBUS_TCP,
          address: slaveId.toString(),
          capabilities: ['read', 'write'],
          metadata: {
            slaveId,
            protocol: 'Modbus TCP',
          },
        });

        console.log(`[ModbusTCP] Found device at Slave ID ${slaveId}`);
      } catch (error) {
        // Device not responding, continue scanning
      }
    }

    console.log(`[ModbusTCP] Discovery complete. Found ${devices.length} devices.`);
    return devices;
  }

  /**
   * Parse Modbus address string
   * Format: {slaveId}:{functionCode}:{address}:{dataType}
   * Example: "1:3:40001:FLOAT"
   */
  private parseAddress(address: string): ModbusAddress {
    const parts = address.split(':');

    if (parts.length < 3) {
      throw new Error(
        `Invalid Modbus address format: ${address}. Expected format: slaveId:functionCode:address[:dataType]`
      );
    }

    const slaveId = parseInt(parts[0]);
    const functionCode = parseInt(parts[1]);
    const addr = parseInt(parts[2]);
    const dataTypeStr = parts[3] || 'INT16';

    if (isNaN(slaveId) || slaveId < 1 || slaveId > 247) {
      throw new Error(`Invalid slave ID: ${parts[0]}. Must be 1-247.`);
    }

    if (isNaN(functionCode) || ![1, 2, 3, 4, 5, 6, 15, 16].includes(functionCode)) {
      throw new Error(`Invalid function code: ${parts[1]}. Supported: 1-6, 15-16.`);
    }

    if (isNaN(addr)) {
      throw new Error(`Invalid address: ${parts[2]}`);
    }

    const dataType = this.parseDataType(dataTypeStr);
    const count = this.getRegisterCount(dataType);

    return { slaveId, functionCode, address: addr, dataType, count };
  }

  private parseDataType(typeStr: string): DataType {
    const mapping: Record<string, DataType> = {
      BOOL: DataType.BOOLEAN,
      BOOLEAN: DataType.BOOLEAN,
      INT16: DataType.INT16,
      INT32: DataType.INT32,
      UINT16: DataType.UINT16,
      UINT32: DataType.UINT32,
      FLOAT: DataType.FLOAT,
      DOUBLE: DataType.DOUBLE,
    };

    const dataType = mapping[typeStr.toUpperCase()];
    if (!dataType) {
      throw new Error(
        `Unsupported data type: ${typeStr}. Supported: BOOL, INT16, INT32, UINT16, UINT32, FLOAT, DOUBLE`
      );
    }

    return dataType;
  }

  private getRegisterCount(dataType: DataType): number {
    switch (dataType) {
      case DataType.BOOLEAN:
      case DataType.INT16:
      case DataType.UINT16:
        return 1;
      case DataType.INT32:
      case DataType.UINT32:
      case DataType.FLOAT:
        return 2;
      case DataType.DOUBLE:
        return 4;
      default:
        return 1;
    }
  }

  private convertRegisterValue(buffer: Buffer, dataType: DataType): unknown {
    switch (dataType) {
      case DataType.BOOLEAN:
        return buffer.readUInt16BE(0) !== 0;
      case DataType.INT16:
        return buffer.readInt16BE(0);
      case DataType.UINT16:
        return buffer.readUInt16BE(0);
      case DataType.INT32:
        return buffer.readInt32BE(0);
      case DataType.UINT32:
        return buffer.readUInt32BE(0);
      case DataType.FLOAT:
        return buffer.readFloatBE(0);
      case DataType.DOUBLE:
        return buffer.readDoubleBE(0);
      default:
        return buffer.readUInt16BE(0);
    }
  }

  private valueToRegister(value: unknown, dataType: DataType): number {
    const numValue = Number(value);

    switch (dataType) {
      case DataType.BOOLEAN:
        return numValue ? 1 : 0;
      case DataType.INT16:
      case DataType.UINT16:
        return numValue & 0xffff;
      default:
        return numValue;
    }
  }

  private generateTagName(address: ModbusAddress): string {
    const typeMap: Record<number, string> = {
      1: 'coil',
      2: 'discrete_input',
      3: 'holding_register',
      4: 'input_register',
    };

    const type = typeMap[address.functionCode] || 'unknown';
    return `modbus_${type}_${address.slaveId}_${address.address}`;
  }

  private groupAddressesForBulkRead(addresses: string[]): AddressGroup[] {
    const groups: AddressGroup[] = [];
    const parsed = addresses.map((addr) => ({ addr, parsed: this.parseAddress(addr) }));

    // Sort by slave ID, function code, and address
    parsed.sort((a, b) => {
      if (a.parsed.slaveId !== b.parsed.slaveId) {
        return a.parsed.slaveId - b.parsed.slaveId;
      }
      if (a.parsed.functionCode !== b.parsed.functionCode) {
        return a.parsed.functionCode - b.parsed.functionCode;
      }
      return a.parsed.address - b.parsed.address;
    });

    let currentGroup: AddressGroup | null = null;

    for (const item of parsed) {
      const { addr, parsed: p } = item;

      if (
        !currentGroup ||
        currentGroup.slaveId !== p.slaveId ||
        currentGroup.functionCode !== p.functionCode ||
        p.address - currentGroup.endAddress > 1
      ) {
        // Start new group
        currentGroup = {
          slaveId: p.slaveId,
          functionCode: p.functionCode,
          startAddress: p.address,
          endAddress: p.address + (p.count || 1) - 1,
          count: p.count || 1,
          addresses: [addr],
        };
        groups.push(currentGroup);
      } else {
        // Add to current group
        currentGroup.addresses.push(addr);
        currentGroup.endAddress = p.address + (p.count || 1) - 1;
        currentGroup.count = currentGroup.endAddress - currentGroup.startAddress + 1;
      }
    }

    return groups;
  }
}

interface AddressGroup {
  slaveId: number;
  functionCode: number;
  startAddress: number;
  endAddress: number;
  count: number;
  addresses: string[];
}
