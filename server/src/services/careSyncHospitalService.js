import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export const careSyncHospitalService = {
  async get() {
    const hospital = await prisma.hospital.findFirst({ where: { hospitalCode: env.CARESYNC_HOSPITAL_CODE, active: true }, select: { id: true, name: true, hospitalCode: true, city: true, region: true, phone: true, email: true } });
    if (!hospital) throw new AppError('CareSync Hospital is not configured', 503);
    return hospital;
  },
};
