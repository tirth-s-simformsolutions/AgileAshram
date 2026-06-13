import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * A routing target (e.g. Infrastructure, Sanitation, General).
 *
 * Departments do NOT log in — they are buckets that complaints are routed to.
 * The actual login belongs to a `User` with role = department, linked here via
 * `departmentId`.
 *
 * `responsibilities` is a plain-text list of what the department handles; it is
 * fed to the AI so it can pick the best-matching department for a complaint
 * (responsibility-driven routing) instead of a hardcoded category map.
 */
@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  name: string;

  // What this department handles, e.g. ["Potholes", "Streetlights", ...].
  // Drives AI routing and is shown in the UI.
  @Prop({ type: [String], required: true, default: [] })
  responsibilities: string[];

  // Where verified complaints are forwarded (P1 — e.g. AMC CCRS inbox).
  @Prop()
  contactEmail?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export type DepartmentDocument = Department & Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
