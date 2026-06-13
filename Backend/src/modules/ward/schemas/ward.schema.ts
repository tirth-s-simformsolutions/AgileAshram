import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * A municipal ward, identified geographically by a GeoJSON boundary polygon.
 * A complaint's ward is resolved from its GPS point via a point-in-polygon
 * ($geoIntersects) query against the 2dsphere index below — no frontend input.
 */
@Schema({ timestamps: true })
export class Ward {
  @Prop({ required: true, unique: true })
  number: number;

  @Prop()
  name?: string;

  @Prop()
  zone?: string;

  @Prop({ default: true })
  isActive: boolean;

  // GeoJSON Polygon. coordinates: [ [ [lng, lat], ... ] ] — note lng FIRST, ring closed.
  @Prop(
    raw({
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], required: true },
    }),
  )
  boundary: { type: 'Polygon'; coordinates: number[][][] };
}

export type WardDocument = Ward & Document;
export const WardSchema = SchemaFactory.createForClass(Ward);

// Enables $geoIntersects point-in-polygon lookups.
WardSchema.index({ boundary: '2dsphere' });
