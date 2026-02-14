import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { config } from './config/env.js';
import { logError, logInfo } from './config/logger.js';
import { pool } from './db/pool.js';
import authRoutes from './modules/auth/auth.routes.js';
import proyectoRoutes from './modules/proyectos/proyectos.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import apiRoutes from './modules/api/api.routes.js';
import uploadRoutes from './modules/uploads/uploads.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import ciclosRoutes from './modules/ciclos/ciclos.routes.js';
import incidenciasRoutes from './modules/incidencias/incidencias.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();

// Ensure upload dir exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!config.corsOrigins.length || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true
  })
);
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(morgan('combined'));
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

app.use('/api', apiRoutes);
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/ciclos', ciclosRoutes);
app.use('/api/incidencias', incidenciasRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

process.on('unhandledRejection', reason => {
  logError('Unhandled Rejection', { reason });
});

process.on('uncaughtException', err => {
  logError('Uncaught Exception', { error: err.message });
  process.exit(1);
});

const start = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logInfo('MySQL connected');
    app.listen(config.port, () => {
      logInfo('Server started', { port: config.port });
    });
  } catch (err) {
    logError('Failed to connect to MySQL', { error: err.message });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
