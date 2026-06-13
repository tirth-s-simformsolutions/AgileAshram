import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/* ------------------------------------------------------------------ *
 *  Enums
 * ------------------------------------------------------------------ */

export enum ComplaintSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

/**
 * Numeric rank mirror of `severity`. The work queue MUST sort on this — sorting
 * on the severity string would order Critical < High < Low alphabetically.
 */
export const SEVERITY_RANK: Record<ComplaintSeverity, number> = {
  [ComplaintSeverity.LOW]: 1,
  [ComplaintSeverity.MEDIUM]: 2,
  [ComplaintSeverity.HIGH]: 3,
  [ComplaintSeverity.CRITICAL]: 4,
};

/* ------------------------------------------------------------------ *
 *  Embedded sub-documents
 * ------------------------------------------------------------------ */

@Schema({ _id: false })
export class GpsPoint {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}
export const GpsPointSchema = SchemaFactory.createForClass(GpsPoint);

/** What the AI (or the rules-based fallback) decided. */
@Schema({ _id: false })
export class AiMeta {
  @Prop()
  model: string; // 'gemini-flash' | 'rules-fallback'

  @Prop({ default: 0 })
  confidence: number; // 0..1

  @Prop()
  rawLabel?: string; // human-readable issue type, e.g. 'pothole' (shown in UI)

  @Prop({ default: false })
  fallbackUsed: boolean; // true when the rules fallback decided the routing
}
export const AiMetaSchema = SchemaFactory.createForClass(AiMeta);

/** Result of the NSFW / relevance moderation gate. */
@Schema({ _id: false })
export class ModerationMeta {
  @Prop({ default: true })
  passed: boolean;

  @Prop()
  provider: string; // 'gemini' | 'moderatecontent' | 'stub'

  @Prop()
  score?: number;
}
export const ModerationMetaSchema = SchemaFactory.createForClass(ModerationMeta);

/** Final resolution note added by admin/department when closing a complaint. */
@Schema({ _id: false })
export class ResolutionNote {
  @Prop({ required: true })
  comment: string;

  @Prop()
  imageUrl?: string;
}
export const ResolutionNoteSchema = SchemaFactory.createForClass(ResolutionNote);

/** Citizen feedback submitted after a complaint is resolved. */
@Schema({ _id: false })
export class ComplaintFeedback {
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ required: true })
  submittedAt: Date;
}
export const ComplaintFeedbackSchema = SchemaFactory.createForClass(ComplaintFeedback);

/** One entry in the complaint's lifecycle timeline. */
@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({ required: true, enum: ComplaintStatus })
  status: ComplaintStatus;

  @Prop()
  note?: string;

  @Prop({ required: true })
  at: Date;

  // The user who made the change (department staff/admin); null for system.
  @Prop({ type: Types.ObjectId, ref: 'User' })
  byUserId?: Types.ObjectId;

  // Populated only on department-reassignment entries.
  @Prop({ type: Types.ObjectId, ref: 'Department' })
  fromDepartmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  toDepartmentId?: Types.ObjectId;

  @Prop()
  fromDepartmentName?: string;

  @Prop()
  toDepartmentName?: string;
}
export const StatusHistoryEntrySchema = SchemaFactory.createForClass(StatusHistoryEntry);

/* ------------------------------------------------------------------ *
 *  Root document
 * ------------------------------------------------------------------ */

@Schema({ timestamps: true })
export class Complaint {
  /** Human-readable, e.g. NV-2026-000123. Generated via the Counter. */
  @Prop({ required: true, unique: true, index: true })
  ticketId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  citizenId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUrl?: string;

  // --- Routing (responsibility-driven; resolved at intake) ---
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true, index: true })
  departmentId: Types.ObjectId;

  // --- AI output ---
  @Prop({ enum: ComplaintSeverity, default: ComplaintSeverity.LOW })
  severity: ComplaintSeverity;

  /** 1..4 mirror of `severity` — the field the work queue sorts on. */
  @Prop({ default: 1, index: true })
  severityRank: number;

  @Prop({ type: AiMetaSchema })
  aiMeta?: AiMeta;

  @Prop({ type: ModerationMetaSchema })
  moderation?: ModerationMeta;

  // --- Location ---
  @Prop({ type: GpsPointSchema })
  gps?: GpsPoint;

  @Prop()
  reportedAddress?: string;

  // Resolved from gps via point-in-polygon at intake (null if outside known wards).
  @Prop({ type: Types.ObjectId, ref: 'Ward', index: true })
  wardId?: Types.ObjectId;

  @Prop()
  wardNumber?: number;

  // --- Lifecycle ---
  @Prop({ enum: ComplaintStatus, default: ComplaintStatus.OPEN, index: true })
  status: ComplaintStatus;

  @Prop({ type: [StatusHistoryEntrySchema], default: [] })
  statusHistory: StatusHistoryEntry[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: ResolutionNoteSchema })
  resolutionNote?: ResolutionNote;

  // --- External government submission (P1) ---
  @Prop({ default: false })
  amcSubmitted: boolean;

  @Prop({ type: ComplaintFeedbackSchema })
  feedback?: ComplaintFeedback;
}

export type ComplaintDocument = Complaint & Document;
export const ComplaintSchema = SchemaFactory.createForClass(Complaint);

// Work queue: filter by status, sort by severity desc, newest first.
ComplaintSchema.index({ status: 1, severityRank: -1, createdAt: -1 });

// Keep severityRank in sync with severity automatically, so no code path can
// set one without the other and silently break queue sorting.
ComplaintSchema.pre('save', function (next) {
  if (this.isModified('severity') || this.isNew) {
    this.severityRank = SEVERITY_RANK[this.severity] ?? SEVERITY_RANK[ComplaintSeverity.LOW];
  }
  next();
});
