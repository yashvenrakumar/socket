import dotenv from 'dotenv';
import { Server as HTTPServer } from 'http';
import app from './app';
import { Logger } from './utils/logger.util';
import { SocketService } from './services/socket.service';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

const server: HTTPServer = app.listen(PORT, () => {
  Logger.info(`Server is running on port ${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  Logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Initialize Socket.IO
SocketService.initialize(server);
Logger.info(`Socket.IO server initialized on port ${PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    Logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    Logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default server;

