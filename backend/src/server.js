const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/database');
const { initializeSocket } = require('./config/socket');
const logger = require('./config/logger');
const { startDispatchWorker } = require('./workers/dispatch.worker');
require('./config/redis'); // Initialize Redis
require('./services/email.service'); // Initialize email service

const dns = require("dns")
dns.setServers(["8.8.8.8","8.8.4.4"])
dns.setDefaultResultOrder("ipv4first")

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initializeSocket(server);
    const shouldStartDispatchWorkerInApi =
      process.env.START_DISPATCH_WORKER_IN_API === 'true' ||
      env.NODE_ENV === 'development';

    if (shouldStartDispatchWorkerInApi) {
      startDispatchWorker();
      logger.info('[dispatch-worker] Started within API process');
    }

    server.listen(env.PORT, () => {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🚀 SewaFi API Server Started');
      logger.info(`📍 URL: http://localhost:${env.PORT}`);
      logger.info(`📊 Health: http://localhost:${env.PORT}/health`);
      logger.info(`🌍 Env: ${env.NODE_ENV}`);
      logger.info(`🔌 Socket.io: Active`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (err) {
    logger.error(`❌ Server startup failed: ${err.message}`);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.stack || err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  process.exit(0);
});
