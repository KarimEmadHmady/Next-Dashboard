import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { pool, testDbConnection } from './src/config/db.js';
import { initializeDatabase } from './src/db/initDb.js';
import { seedDatabase } from './src/db/seed.js';
import { logger } from './src/utils/logger.util.js';
import { notFound } from './src/middlewares/notFound.middleware.js';
import { errorMiddleware } from './src/middlewares/error.middleware.js';
import { globalRateLimiter } from './src/middlewares/rateLimiter.js';

// Route modules
import authRoutes from './src/modules/auth/auth.routes.js';
import usersRoutes from './src/modules/users/users.routes.js';
import areasRoutes from './src/modules/areas/areas.routes.js';
import storesRoutes from './src/modules/stores/stores.routes.js';
import syncRoutes from './src/modules/sync/sync.routes.js';
import ordersRoutes from './src/modules/orders/orders.routes.js';
import { SyncService } from './src/services/sync.service.js';


// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ================== Security & Utilities Middlewares ==================
app.use(helmet());

// CORS configuration (Credentials enabled for httpOnly cookies)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Retry-After'],
  })
);

// Body parsing with security size limit (100kb per CLAUDE.md)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(compression());

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiting for API
app.use('/api', globalRateLimiter);

// ================== Base Routes ==================
// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Mount modules under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/areas', areasRoutes);
app.use('/api/v1/stores', storesRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/orders', ordersRoutes);

// ================== 404 & Centralized Error Handlers ==================
app.use(notFound);
app.use(errorMiddleware);

// ================== Server Startup & Database Init ==================
const startServer = async () => {
  try {
    logger.info('Initializing database schema...');
    await initializeDatabase();

    logger.info('Running database seeders...');
    await seedDatabase();

    // Initial mirror sync on boot (non-blocking so server can start even if external is slow)
    SyncService.syncAreasAndStores().catch((err) => {
      logger.error('Initial background mirror sync failed, continuing to serve local mirror:', err.message);
    });

    // Schedule recurring sync
    const syncIntervalMinutes = parseInt(process.env.EXTERNAL_SYNC_INTERVAL_MINUTES || '15', 10);
    logger.info(`Scheduled background mirror sync every ${syncIntervalMinutes} minutes.`);
    const syncInterval = setInterval(() => {
      SyncService.syncAreasAndStores().catch((err) => {
        logger.error('Scheduled background mirror sync failed, continuing to serve local mirror:', err.message);
      });
    }, syncIntervalMinutes * 60 * 1000);

    const server = app.listen(port, () => {
      logger.info(`Roxy Store Backend is running on http://localhost:${port}`);
      logger.info(`Health check: http://localhost:${port}/api/v1/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      clearInterval(syncInterval);
      server.close(async () => {
        try {
          await pool.end();
          logger.info('MySQL connection pool closed.');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing database pool:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};


startServer();