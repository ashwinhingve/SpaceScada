import { createServer } from './server';
import { config } from './config';
import { logInfo, logError } from './utils/logger';

const start = async () => {
  try {
    const server = await createServer();

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logInfo(`Received ${signal}, starting graceful shutdown`);

      try {
        // Stop simulation engine
        if (server.simulationEngine) {
          server.simulationEngine.stop();
        }

        // Close WebSocket connections
        if (server.wsServer) {
          await server.wsServer.close();
        }

        // Close HTTP server
        await server.close();

        logInfo('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logError('Error during shutdown', error);
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logError('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logError('Unhandled rejection', reason, { promise });
      gracefulShutdown('unhandledRejection');
    });

    // Start server
    await server.listen({
      port: config.port,
      host: config.host,
    });

    logInfo('Server started successfully', {
      port: config.port,
      host: config.host,
      nodeEnv: config.nodeEnv,
    });

    logInfo('Endpoints:', {
      api: `http://${config.host}:${config.port}/api`,
      health: `http://${config.host}:${config.port}/api/health`,
      metrics: `http://${config.host}:${config.port}/api/metrics`,
      websocket: `ws://${config.host}:${config.port}`,
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
};

start();
