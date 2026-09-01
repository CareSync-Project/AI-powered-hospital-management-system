import prisma from '../config/prisma.js';

export const notificationRepository = {
  findByUser: (userId, client = prisma) => client.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  create: (data, client = prisma) => client.notification.create({ data }),
};
