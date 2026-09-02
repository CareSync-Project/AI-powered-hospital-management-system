import { notificationRepository } from '../repositories/notificationRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationService = {
  list: (userId) => notificationRepository.findByUser(userId),
  create: (data, client) => notificationRepository.create(data, client),
  async markRead(id, userId) {
    const item = await notificationRepository.findById(id);
    if (!item) throw new AppError('Notification not found', 404);
    if (item.userId !== userId) throw new AppError('Not authorized', 403);
    return notificationRepository.markRead(id);
  },
  markAllRead: (userId) => notificationRepository.markAllRead(userId),
};
