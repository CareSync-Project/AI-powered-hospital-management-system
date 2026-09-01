import prisma from '../src/config/prisma.js';

async function main() {
  console.log('No Phase 1 seed records are defined. Add reviewed development data in a later phase.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
