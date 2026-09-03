import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

async function main() {
  const email = required('ADMIN_EMAIL').toLowerCase();
  const password = required('ADMIN_PASSWORD');
  const firstName = required('ADMIN_FIRST_NAME');
  const lastName = required('ADMIN_LAST_NAME');

  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_EMAIL must be a valid email address.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');

  const hospitalCode = process.env.CARESYNC_HOSPITAL_CODE?.trim() || 'VCTH-DEMO';
  const employeeNumber = process.env.ADMIN_EMPLOYEE_NUMBER?.trim() || 'ADM-001';
  const phone = process.env.ADMIN_PHONE?.trim() || '+233000000001';
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const hospital = await tx.hospital.upsert({
      where: { hospitalCode },
      update: { active: true },
      create: {
        name: process.env.HOSPITAL_NAME?.trim() || 'CareSync Hospital',
        hospitalCode,
        address: process.env.HOSPITAL_ADDRESS?.trim() || 'To be configured',
        city: process.env.HOSPITAL_CITY?.trim() || 'Ho',
        region: process.env.HOSPITAL_REGION?.trim() || 'Volta Region',
        country: process.env.HOSPITAL_COUNTRY?.trim() || 'Ghana',
        phone: process.env.HOSPITAL_PHONE?.trim() || '+233000000000',
        email: process.env.HOSPITAL_EMAIL?.trim() || 'contact@caresync.invalid',
      },
    });

    const user = await tx.user.upsert({
      where: { email },
      update: { role: 'ADMIN', passwordHash, active: true, emailVerified: true },
      create: { email, role: 'ADMIN', passwordHash, active: true, emailVerified: true },
    });

    const profile = await tx.adminProfile.upsert({
      where: { userId: user.id },
      update: { hospitalId: hospital.id, employeeNumber, firstName, lastName, phone, active: true },
      create: { userId: user.id, hospitalId: hospital.id, employeeNumber, firstName, lastName, phone },
    });

    return { email: user.email, hospital: hospital.name, employeeNumber: profile.employeeNumber };
  });

  console.log(`Administrator ${result.email} is ready for ${result.hospital} (${result.employeeNumber}).`);
}

main()
  .catch((error) => {
    console.error(`Administrator creation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
