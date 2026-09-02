import prisma from '../config/prisma.js';

export const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  active: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export const userRepository = {
  findById: (id, client = prisma) => client.user.findUnique({ where: { id }, select: publicUserSelect }),
  findByEmailForAuthentication: (email, client = prisma) => client.user.findUnique({ where: { email } }),
};
