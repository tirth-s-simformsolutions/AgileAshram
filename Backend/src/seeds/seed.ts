import { pbkdf2Sync, randomBytes } from 'crypto';
import 'dotenv/config';
import mongoose from 'mongoose';
import { DEFAULT_DEPARTMENTS } from '../modules/department/department.constants';
import { DepartmentModel } from '../modules/department/department.model';
import { UserRole, UserStatus } from '../modules/user/schemas/user.schema';
import { UserModel } from '../modules/user/user.model';

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? 'Test@123';
const DEPT_DEFAULT_PASSWORD = process.env.DEPT_DEFAULT_PASSWORD ?? 'Dept@1234';

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `${hash}.${salt}`;
}

// Derive a slug like "garbage_waste_management" from a department name
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function seedAdmin() {
  const adminExists = await UserModel.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    await UserModel.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashPassword(ADMIN_DEFAULT_PASSWORD),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    console.log(`✓ Admin seeded          admin@example.com / ${ADMIN_DEFAULT_PASSWORD}`);
  } else {
    console.log('· Admin already exists  admin@example.com');
  }
}

async function seedDepartments() {
  for (const dept of DEFAULT_DEPARTMENTS) {
    const slug = toSlug(dept.name);

    // 1. Upsert department
    let department = await DepartmentModel.findOne({ name: dept.name });
    if (!department) {
      department = await DepartmentModel.create({
        name: dept.name,
        responsibilities: dept.responsibilities,
        keywords: dept.keywords,
        isActive: true,
      });
      console.log(`✓ Department seeded     ${dept.name}`);
    } else {
      console.log(`· Dept already exists   ${dept.name}`);
    }

    // 2. Upsert department admin user linked to this department
    const adminEmail = `${slug}@example.com`;
    const adminPassword = DEPT_DEFAULT_PASSWORD;

    const adminExists = await UserModel.findOne({ email: adminEmail });
    if (!adminExists) {
      await UserModel.create({
        name: `${dept.name} Admin`,
        email: adminEmail,
        password: hashPassword(adminPassword),
        role: UserRole.DEPARTMENT,
        status: UserStatus.ACTIVE,
        departmentId: department._id,
      });
      console.log(`✓ Dept admin seeded     ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`· Dept admin exists     ${adminEmail}`);
    }
  }
}

async function seed() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB\n');

    await seedAdmin();
    console.log('');
    await seedDepartments();

    console.log('\nSeeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
