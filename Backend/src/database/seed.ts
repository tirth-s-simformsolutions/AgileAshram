import { PrismaClient } from '@prisma/client';
import { randomBytes, pbkdf2Sync } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.user.deleteMany();

  // Create test user
  // Use pbkdf2Sync to hash the password
  const salt = randomBytes(16).toString('hex');
  const hashedPassword =
    pbkdf2Sync(
      'Test@123',
      salt,
      100000, // Default to 100000
      64,
      'sha512',
    ).toString('hex') +
    '.' +
    salt;

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('Seeded test user:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
