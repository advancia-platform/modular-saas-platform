import app from './app';
import { logger } from './logger';

const port = process.env.PORT || 5000;

app.listen(port, () => {
  logger.info(`Backend server started on port ${port}`, {
    port,
    env: process.env.NODE_ENV || 'development'
  });
  console.log(`Backend running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
