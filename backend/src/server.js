// backend/src/server.js
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start HTTP Server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🛡️ SANGYAN Backend API running on port: ${PORT}`);
      console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 URL: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down SANGYAN server gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start SANGYAN backend server:', error.message);
    process.exit(1);
  }
};

startServer();
