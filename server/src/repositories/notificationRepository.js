import prisma from '../config/prisma.js';

export const notificationRepository = {
  findByUser: (userId, client = prisma) => client.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  create: (data, client = prisma) => client.notification.create({ data }),
  findById: (id, client = prisma) => client.notification.findUnique({ where: { id } }),
  markRead: (id, client = prisma) => client.notification.update({ where: { id }, data: { read: true, readAt: new Date() } }),
  markAllRead: (userId, client = prisma) => client.notification.updateMany({ where: { userId, read: false }, data: { read: true, readAt: new Date() } }),
};
