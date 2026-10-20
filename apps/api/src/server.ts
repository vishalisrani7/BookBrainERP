import { app } from './app';
import { config } from './config/environment';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

async function bootstrap() {
  try {
    logger.info('Initializing BookBrain Manufacturing Inventory & WIP Management System...');
    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API v1 Base: http://localhost:${config.port}/api/v1`);
    });

    const shutdown = () => {
      logger.info('Received shutdown signal. Closing HTTP server...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
