// server.js - Express Backend Template
// Description: Clean, structured template for starting any new project

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import compression from 'compression';
import helmet from 'helmet'; 
import rateLimit from 'express-rate-limit'; 

import connectDB from './src/config/index.js';
import { performanceMonitor } from './src/middlewares/performance.middleware.js';
import { notFound } from './src/middlewares/notFound.middleware.js';
import { errorMiddleware, asyncHandler } from './src/middlewares/error.middleware.js';

// ================== Load Environment Variables ==================
dotenv.config();

// ================== Connect to MongoDB ==================
connectDB(); // Singleton connection

// ================== Initialize Express App ==================
const app = express();
const port = process.env.PORT || 5000;

// ================== Middleware ==================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-requested-with',
    'Content-Disposition',
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
}));

// Logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing (JSON & URL-encoded)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Optional: Rate limiting for public endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use(limiter);

// Performance monitoring (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(performanceMonitor);
}

// ================== Routes ==================
// Example route using asyncHandler
// app.use('/api/auth', authRoutes);

// ================== 404 Not Found Handler ==================
app.use(notFound);

// ================== Error Handling Middleware ==================
app.use(errorMiddleware);

// ================== Graceful Shutdown for MongoDB ==================
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected on app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during MongoDB disconnection', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ================== Start Server ==================
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});