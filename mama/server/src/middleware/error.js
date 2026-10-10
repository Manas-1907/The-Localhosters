import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps async route handlers so thrown errors reach errorHandler.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (_req, res) => res.status(404).json({ error: 'Not found' });

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid input', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error('SERVER ROUTE ERROR:', err);
  res.status(500).json({ error: err.message || 'Something went wrong' });
};
