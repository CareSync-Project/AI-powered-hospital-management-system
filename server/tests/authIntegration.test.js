import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { comparePassword } from '../src/utils/password.js';
import { hashRefreshToken } from '../src/utils/tokens.js';

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const email = `phase3-${suffix}@example.invalid`;
const originalPassword = 'SecurePass123';
const newPassword = 'ChangedPass456';
let userId;
let accessToken;
let refreshCookie;

const registration = { email, password: originalPassword, confirmPassword: originalPassword, firstName: 'Phase', lastName: 'Tester', phone: '+233200000001', dateOfBirth: '1995-05-10', gender: 'PREFER_NOT_TO_SAY' };
const cookieValue = (cookie) => decodeURIComponent(cookie.split(';')[0].split('=').slice(1).join('='));

describe.sequential('Phase 3 database-backed authentication', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    if (userId) {
      await prisma.auditLog.deleteMany({ where: { userId } });
      await prisma.authSession.deleteMany({ where: { userId } });
      await prisma.patientProfile.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  test('patient registration hashes the password and returns no passwordHash', async () => {
    const response = await request(app).post('/api/auth/register').send(registration).expect(201);
    expect(response.body.data.user.role).toBe('PATIENT');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    const stored = await prisma.user.findUnique({ where: { email } });
    userId = stored.id;
    expect(stored.passwordHash).not.toBe(originalPassword);
    expect(await comparePassword(originalPassword, stored.passwordHash)).toBe(true);
  });

  test('duplicate email is rejected', async () => {
    await request(app).post('/api/auth/register').send(registration).expect(409);
  });

  test.each(['ADMIN', 'DOCTOR', 'NURSE'])('public registration cannot create %s', async (role) => {
    await request(app).post('/api/auth/register').send({ ...registration, email: `${role.toLowerCase()}-${email}`, role }).expect(400);
  });

  test('invalid login is generic and valid login creates a hashed session', async () => {
    const invalid = await request(app).post('/api/auth/login').send({ email, password: 'WrongPassword1' }).expect(401);
    expect(invalid.body.message).toBe('Invalid email or password.');
    const response = await request(app).post('/api/auth/login').send({ email, password: originalPassword }).expect(200);
    accessToken = response.body.data.accessToken;
    refreshCookie = response.headers['set-cookie'][0];
    expect(accessToken).toBeTruthy();
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    const raw = cookieValue(refreshCookie);
    const session = await prisma.authSession.findFirst({ where: { userId, revokedAt: null } });
    expect(session.refreshTokenHash).toBe(hashRefreshToken(raw));
    expect(session.refreshTokenHash).not.toBe(raw);
  });

  test('protected endpoint rejects missing/invalid tokens and accepts a valid token', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token').expect(401);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(response.body.data.user.id).toBe(userId);
  });

  test('refresh rotates the cookie and old refresh token cannot be reused', async () => {
    const oldCookie = refreshCookie;
    const response = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie).expect(200);
    refreshCookie = response.headers['set-cookie'][0];
    accessToken = response.body.data.accessToken;
    expect(cookieValue(refreshCookie)).not.toBe(cookieValue(oldCookie));
    await request(app).post('/api/auth/refresh').set('Cookie', oldCookie).expect(401);
  });

  test('change password keeps current session, rotates it, and rejects old password', async () => {
    const response = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${accessToken}`).set('Cookie', refreshCookie).send({ currentPassword: originalPassword, newPassword, confirmPassword: newPassword }).expect(200);
    accessToken = response.body.data.accessToken;
    refreshCookie = response.headers['set-cookie'][0];
    await request(app).post('/api/auth/login').send({ email, password: originalPassword }).expect(401);
    await request(app).post('/api/auth/login').send({ email, password: newPassword }).expect(200);
  });

  test('logout revokes the current session', async () => {
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`).set('Cookie', refreshCookie).expect(200);
    await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie).expect(401);
  });

  test('inactive users cannot login', async () => {
    await prisma.user.update({ where: { id: userId }, data: { active: false } });
    await request(app).post('/api/auth/login').send({ email, password: newPassword }).expect(401);
    await prisma.user.update({ where: { id: userId }, data: { active: true } });
  });

  test('logout-all revokes every active user session', async () => {
    const first = await request(app).post('/api/auth/login').send({ email, password: newPassword }).expect(200);
    const second = await request(app).post('/api/auth/login').send({ email, password: newPassword }).expect(200);
    await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${first.body.data.accessToken}`).set('Cookie', first.headers['set-cookie'][0]).expect(200);
    await request(app).post('/api/auth/refresh').set('Cookie', second.headers['set-cookie'][0]).expect(401);
    expect(await prisma.authSession.count({ where: { userId, revokedAt: null } })).toBe(0);
  });

  test('failed-login limiter eventually returns 429', async () => {
    const statuses = [];
    for (let index = 0; index < 12; index += 1) {
      const response = await request(app).post('/api/auth/login').send({ email: `missing-${index}@example.invalid`, password: 'WrongPassword1' });
      statuses.push(response.status);
    }
    expect(statuses).toContain(429);
  });
});
