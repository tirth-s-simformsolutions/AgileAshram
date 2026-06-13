import { pbkdf2Sync, randomBytes } from 'crypto';
import 'dotenv/config'; // Loads .env automatically
import mongoose from 'mongoose';
import { UserStatus } from '../modules/user/schemas/user.schema';
import { UserModel } from '../modules/user/user.model';

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB');

    // Seed admin user if not exists
    const adminExists = await UserModel.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
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
      await UserModel.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        status: UserStatus.ACTIVE,
      });
      console.log('Admin user seeded');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
