import prisma from '../config/prisma.js';
import { getAdminHospitalId } from '../services/authorizationService.js';
import { auditService } from '../services/auditService.js';
import { emailService } from '../services/emailService.js';

/** Map audience enum → Prisma role filter */
const audienceRoles = {
  ALL:      ['PATIENT', 'DOCTOR', 'NURSE'],
  PATIENTS: ['PATIENT'],
  DOCTORS:  ['DOCTOR'],
  NURSES:   ['NURSE'],
  STAFF:    ['DOCTOR', 'NURSE'],
};

export const announcementController = {
  /** GET /admin/announcements */
  async list(request, response) {
    const hospitalId = getAdminHospitalId(request.auth);
    const announcements = await prisma.announcement.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    response.json({ success: true, data: announcements });
  },

  /** POST /admin/announcements */
  async create(request, response) {
    const hospitalId = getAdminHospitalId(request.auth);
    const { title, message, audience } = request.body;
    const roles = audienceRoles[audience] || ['PATIENT', 'DOCTOR', 'NURSE'];

    // Build role-specific hospital criteria to match Prisma schema relations
    const hospitalConditions = [];
    if (roles.includes('PATIENT')) {
      // CareSync is a single-hospital application. Publicly registered patients
      // may not have a PatientHospitalRecord until their first hospital workflow,
      // but they must still receive hospital-wide patient announcements.
      hospitalConditions.push({ role: 'PATIENT' });
    }
    if (roles.includes('DOCTOR')) {
      hospitalConditions.push({ doctorProfile: { hospitalAffiliations: { some: { hospitalId, active: true } } } });
    }
    if (roles.includes('NURSE')) {
      hospitalConditions.push({ nurseProfile: { hospitalId } });
    }

    // Fan-out: find all active users matching role and hospital criteria
    const targetUsers = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: roles },
        ...(hospitalConditions.length > 0 ? { OR: hospitalConditions } : {})
      },
      select: {
        id: true,
        email: true,
        patientProfile: { select: { firstName: true, lastName: true } },
        doctorProfile:  { select: { firstName: true, lastName: true } },
        nurseProfile:   { select: { firstName: true, lastName: true } },
      },
    });

    // Create announcement record + fan-out notifications in one transaction
    const [announcement] = await prisma.$transaction([
      prisma.announcement.create({
        data: {
          hospitalId,
          createdById: request.auth.userId,
          title,
          message,
          audience,
          sentCount: targetUsers.length,
        },
      }),
      prisma.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          hospitalId,
          title,
          message,
          type: 'ANNOUNCEMENT',
        })),
        skipDuplicates: true,
      }),
    ]);

    await auditService.record({
      userId: request.auth.userId,
      hospitalId,
      action: 'ANNOUNCEMENT_SENT',
      resourceType: 'Announcement',
      resourceId: announcement.id,
      request,
    });

    // Fire-and-forget email broadcast (does not block response)
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { name: true } });
    const htmlTemplate = emailService.announcementHtml({ title, message, hospitalName: hospital?.name });
    const recipients = targetUsers.map(u => {
      const profile = u.patientProfile || u.doctorProfile || u.nurseProfile;
      const name = profile ? `${profile.firstName} ${profile.lastName}` : undefined;
      return { email: u.email, name };
    });
    emailService.broadcast({ recipients, subject: title, html: htmlTemplate }).catch(err =>
      console.error('[announcementController] Email broadcast error:', err.message)
    );

    response.status(201).json({ success: true, data: announcement });
  },
};
