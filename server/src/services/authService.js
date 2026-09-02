import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { authRepository } from '../repositories/authRepository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from '../utils/tokens.js';
import { serializeAuthContext } from '../utils/serializers.js';
import { auditService } from './auditService.js';
import { AppError } from '../middleware/errorHandler.js';

const sessionExpiry = () => new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86400000);
const sessionMetadata = (request) => ({ ipAddress: request.ip || null, userAgent: request.get('user-agent')?.slice(0, 500) || null });

function issueTokens(user, sessionId, refreshToken) {
  return {
    accessToken: generateAccessToken({ userId: user.id, role: user.role, sessionId }),
    refreshToken,
    context: serializeAuthContext(user),
  };
}

export const authService = {
  async registerPatient(data, request) {
    const email = data.email.trim().toLowerCase();
    if (await authRepository.findUserByEmail(email)) throw new AppError('An account with this email already exists', 409);
    const passwordHash = await hashPassword(data.password);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: {
        email, passwordHash, role: 'PATIENT',
        patientProfile: { create: {
          firstName: data.firstName, lastName: data.lastName, otherNames: data.otherNames || null,
          phone: data.phone, dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00.000Z`), gender: data.gender,
          address: data.address || 'Not provided', city: data.city || 'Not provided', region: data.region || 'Not provided',
        } },
      }, include: authContextIncludeForTransaction });
      await auditService.record({ userId: user.id, action: 'PATIENT_REGISTRATION', resourceType: 'User', resourceId: user.id, request }, tx);
      return serializeAuthContext(user);
    });
  },

  async login({ email, password }, request) {
    const user = await authRepository.findUserByEmail(email.trim().toLowerCase());
    const valid = user ? await comparePassword(password, user.passwordHash) : false;
    if (!user || !valid || !user.active) {
      if (user) await auditService.record({ userId: user.id, action: 'LOGIN_FAILURE', resourceType: 'User', resourceId: user.id, request });
      throw new AppError('Invalid email or password.', 401);
    }
    const refreshToken = generateRefreshToken();
    const result = await prisma.$transaction(async (tx) => {
      const session = await authRepository.createSession({ userId: user.id, refreshTokenHash: hashRefreshToken(refreshToken), expiresAt: sessionExpiry(), ...sessionMetadata(request) }, tx);
      const updated = await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() }, include: authContextIncludeForTransaction });
      await auditService.record({ userId: user.id, action: 'LOGIN_SUCCESS', resourceType: 'AuthSession', resourceId: session.id, request }, tx);
      return { user: updated, session };
    });
    return issueTokens(result.user, result.session.id, refreshToken);
  },

  async refresh(rawToken, request) {
    if (!rawToken) throw new AppError('Refresh session is required', 401);
    const session = await authRepository.findSessionByHash(hashRefreshToken(rawToken));
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) throw new AppError('Refresh session is invalid or expired', 401);
    const refreshToken = generateRefreshToken();
    await authRepository.rotateSession(session.id, { refreshTokenHash: hashRefreshToken(refreshToken), expiresAt: sessionExpiry(), ...sessionMetadata(request) });
    return issueTokens(session.user, session.id, refreshToken);
  },

  async getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user?.active) throw new AppError('Authentication required', 401);
    return serializeAuthContext(user);
  },

  async logout(sessionId, userId, request) {
    await authRepository.revokeSession(sessionId);
    await auditService.record({ userId, action: 'LOGOUT', resourceType: 'AuthSession', resourceId: sessionId, request });
  },

  async logoutAll(userId, request) {
    await authRepository.revokeUserSessions(userId);
    await auditService.record({ userId, action: 'LOGOUT_ALL', resourceType: 'AuthSession', request });
  },

  async changePassword(userId, currentSessionId, data, request) {
    const user = await authRepository.findUserById(userId);
    if (!user || !(await comparePassword(data.currentPassword, user.passwordHash))) throw new AppError('Current password is incorrect', 400);
    if (await comparePassword(data.newPassword, user.passwordHash)) throw new AppError('New password must be different', 400);
    const passwordHash = await hashPassword(data.newPassword);
    const refreshToken = generateRefreshToken();
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await authRepository.revokeUserSessions(userId, currentSessionId, tx);
      await authRepository.rotateSession(currentSessionId, { refreshTokenHash: hashRefreshToken(refreshToken), expiresAt: sessionExpiry() }, tx);
      await auditService.record({ userId, action: 'PASSWORD_CHANGE', resourceType: 'User', resourceId: userId, request }, tx);
    });
    return issueTokens(user, currentSessionId, refreshToken);
  },

  cleanupSessions(retentionDays = 30) {
    return authRepository.deleteExpiredAndOldRevoked(new Date(Date.now() - retentionDays * 86400000));
  },
};

const authContextIncludeForTransaction = {
  adminProfile: true,
  patientProfile: { include: { hospitalRecords: true } },
  doctorProfile: { include: { hospitalAffiliations: true, departments: true } },
  nurseProfile: true,
};
