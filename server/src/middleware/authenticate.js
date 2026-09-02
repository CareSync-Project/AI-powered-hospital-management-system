import { authRepository } from '../repositories/authRepository.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { AppError } from './errorHandler.js';

export async function authenticate(request, _response, next) {
  try {
    const authorization = request.get('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AppError('Authentication required', 401);
    const claims = verifyAccessToken(authorization.slice(7));
    const session = await authRepository.findSessionById(claims.sessionId);
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active || session.userId !== claims.sub || session.user.role !== claims.role) {
      throw new AppError('Authentication required', 401);
    }
    request.auth = { userId: session.userId, sessionId: session.id, role: session.user.role, user: session.user };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Authentication required', 401));
  }
}

export const requireAnyRole = (...roles) => (request, _response, next) => {
  if (!request.auth) return next(new AppError('Authentication required', 401));
  if (!roles.includes(request.auth.role)) return next(new AppError('Not authorized', 403));
  return next();
};

export const requireRole = (role) => requireAnyRole(role);
