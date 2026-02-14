import { logError } from '../config/logger.js';

const mapMulterError = err => {
  if (!err) return null;
  if (err.code === 'LIMIT_FILE_SIZE') return { status: 413, message: 'File too large' };
  return null;
};

export const errorHandler = (err, req, res, _next) => {
  logError('Unhandled error', { error: err?.message, stack: err?.stack });
  if (res.headersSent) return;
  const multerMapped = mapMulterError(err);
  const status = multerMapped?.status ?? err?.status ?? 500;
  const message = multerMapped?.message ?? err?.message ?? 'Internal Server Error';
  const payload = {
    timestamp: new Date().toISOString(),
    status,
    error: status === 500 ? 'Internal Server Error' : (err?.name ?? 'Error'),
    message,
    path: req.originalUrl
  };
  res.status(status).json(payload);
};
