import dotenv from 'dotenv';

dotenv.config();

const required = key => {
  const value = process.env[key];
  // Permit empty string as a valid value (e.g., MySQL user with no password)
  if (value === undefined) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000/api',
  db: {
    host: required('DB_HOST'),
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME')
  },
  jwtSecret: required('JWT_SECRET'),
  uploadDir: process.env.FILE_UPLOAD_DIR ?? 'uploads',
  corsOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10)
  }
};
