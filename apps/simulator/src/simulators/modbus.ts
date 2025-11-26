import { createLogger } from '@webscada/utils';

import { DataGenerator } from '../generators/data';

const logger = createLogger({ prefix: 'ModbusSimulator' });

export class ModbusSimulator {
  private port: number;
  private dataGenerator: DataGenerator;
  private registers: Map<number, number> = new Map();
  private updateInterval?: NodeJS.Timeout;

  constructor(port: number, dataGenerator: DataGenerator) {
    this.port = port;
    this.dataGenerator = dataGenerator;
    this.initializeRegisters();
  }

  private initializeRegisters(): void {
    // Initialize 100 holding registers with random values
    for (let i = 0; i < 100; i++) {
      this.registers.set(40000 + i, this.dataGenerator.generateRandom());
    }
    logger.info('Initialized 100 holding registers');
  }

  async start(): Promise<void> {
    logger.info(`Starting Modbus TCP simulator on port ${this.port}`);

    // TODO: Implement actual Modbus TCP server
    // This would use a library like 'modbus-serial' or implement the protocol

    // Simulate register updates
    this.updateInterval = setInterval(() => {
      this.updateRegisters();
    }, 1000);

    logger.info('Modbus simulator started successfully');
  }

  private updateRegisters(): void {
    // Update some registers with different patterns
    this.registers.set(40000, this.dataGenerator.generateSineWave('40000', 0.1));
    this.registers.set(40001, this.dataGenerator.generateGradual('40001'));
    this.registers.set(40002, this.dataGenerator.generateSawtooth('40002', 30));
    this.registers.set(40003, this.dataGenerator.generateSquareWave('40003', 20));

    // Update random registers
    for (let i = 4; i < 10; i++) {
      const address = 40000 + i;
      this.registers.set(address, this.dataGenerator.generateGradual(`${address}`));
    }
  }

  readRegister(address: number): number | undefined {
    return this.registers.get(address);
  }

  writeRegister(address: number, value: number): void {
    this.registers.set(address, value);
    logger.debug(`Write to register ${address}: ${value}`);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    logger.info('Modbus simulator stopped');
  }
}
