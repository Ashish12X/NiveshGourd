// backend/src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import understandingRoutes from './routes/understandingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import compareRoutes from './routes/compareRoutes.js';
import decisionReadinessRoutes from './routes/decisionReadinessRoutes.js';
import safetyRoutes from './routes/safetyRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables if not loaded
dotenv.config();

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration with credentials support for cookies
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (origin === clientOrigin || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed for this origin.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'NiveshGuard Backend API (SANGYAN 2026)',
    stage: 'Stage 9 (Final Polish & Verification)',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/understanding-profile', understandingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/decision-readiness', decisionReadinessRoutes);
app.use('/api/safety', safetyRoutes);

// 404 handler for undefined API routes
app.use(notFound);

// Global centralized error handler
app.use(errorHandler);

export default app;
