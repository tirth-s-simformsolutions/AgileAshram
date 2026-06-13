import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Atomic sequence generator for human-readable ticket numbers.
 *
 * Usage (in the service):
 *   findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, new: true })
 * then format as `NV-2026-` + seq padded to 6 digits → NV-2026-000123.
 *
 * Using an atomic $inc avoids the duplicate-ticketId race that a count()+1
 * approach hits when complaints are submitted concurrently.
 */
@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  key: string; // e.g. 'complaint-2026'

  @Prop({ required: true, default: 0 })
  seq: number;
}

export type CounterDocument = Counter & Document;
export const CounterSchema = SchemaFactory.createForClass(Counter);
