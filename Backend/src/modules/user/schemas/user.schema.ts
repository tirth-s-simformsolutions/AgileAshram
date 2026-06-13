import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

/**
 * Three actor types share this collection, separated by `role`:
 *  - citizen    : files complaints (DigiLocker login → digilockerId + phone)
 *  - department : resolves complaints routed to its department (email/password + departmentId)
 *  - admin      : super admin, oversees everything (email/password)
 *
 * Auth fields differ per role and are validated in the service layer; the
 * schema stays permissive so all three can live in one collection.
 */
export enum UserRole {
  CITIZEN = 'citizen',
  DEPARTMENT = 'department',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, default: UserRole.CITIZEN, enum: UserRole })
  role: UserRole;

  @Prop()
  name?: string;

  @Prop({ default: UserStatus.ACTIVE, enum: UserStatus })
  status: UserStatus;

  // --- department / admin login ---
  // Optional + sparse so many citizens (no email) don't collide on null.
  @Prop({ unique: true, sparse: true, lowercase: true })
  email?: string;

  @Prop()
  password?: string;

  // Department this user works for (required only for role = department).
  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  // --- citizen (DigiLocker) login ---
  // Verified-citizen subject id; sparse unique for the same reason as email.
  @Prop({ unique: true, sparse: true })
  digilockerId?: string;

  // E.164 phone number — used for Twilio SMS notifications.
  @Prop()
  phone?: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
