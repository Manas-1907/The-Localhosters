import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './error.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id || user.id), role: user.role, name: user.name, email: user.email }, config.jwtSecret, { expiresIn: '2d' });

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Please sign in'));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, role: payload.role, name: payload.name, email: payload.email };
    next();
  } catch {
    next(new HttpError(401, 'Your session expired. Please sign in again'));
  }
};

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'Not allowed'));
