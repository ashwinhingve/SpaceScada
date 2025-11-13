import 'dotenv/config';

import { createLogger } from '@webscada/utils';
import { ModbusSimulator } from './simulators/modbus';
import { DataGenerator } from './generators/data';

const logger = createLogger({ prefix: 'Simulator' });

const start = async () => {
  try {
    logger.info('Starting device simulator...');

    const protocol = process.env.SIMULATOR_PROTOCOL || 'MODBUS_TCP';
    const port = parseInt(process.env.SIMULATOR_PORT || '5020', 10);
    const updateInterval = parseInt(process.env.UPDATE_INTERVAL || '1000', 10);

    // Initialize data generator
    const dataGenerator = new DataGenerator({
      minValue: parseFloat(process.env.MIN_VALUE || '0'),
      maxValue: parseFloat(process.env.MAX_VALUE || '100'),
      changeRate: parseFloat(process.env.VALUE_CHANGE_RATE || '5'),
    });

    // Start simulator based on protocol
    switch (protocol) {
      case 'MODBUS_TCP':
        const modbusSimulator = new ModbusSimulator(port, dataGenerator);
        await modbusSimulator.start();
        break;
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }

    logger.info(`Simulator started on port ${port} with protocol ${protocol}`);
    logger.info(`Update interval: ${updateInterval}ms`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down...`);
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start simulator:', error);
    process.exit(1);
  }
};

start();
