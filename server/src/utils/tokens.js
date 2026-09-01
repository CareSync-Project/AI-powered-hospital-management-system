import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const getJwtSecret = () => {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET must be configured');
  return env.JWT_SECRET;
};

export const generateRefreshToken = () => randomBytes(48).toString('base64url');
export const hashRefreshToken = (token) => createHash('sha256').update(token).digest('hex');
export const generateAccessToken = ({ userId, role, sessionId }) => jwt.sign(
  { role, sessionId },
  getJwtSecret(),
  { subject: userId, expiresIn: env.ACCESS_TOKEN_TTL, issuer: 'ai-hospital-api', audience: 'ai-hospital-client' },
);
export const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret(), {
  issuer: 'ai-hospital-api',
  audience: 'ai-hospital-client',
});
