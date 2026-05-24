import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum VendorCategory {
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  HVAC = 'hvac',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  GENERAL_CONTRACTOR = 'general_contractor',
}

export type VendorDocument = HydratedDocument<Vendor>;

@Schema({ _id: false })
export class VendorServiceHistory {
  @Prop({ type: Date, default: Date.now })
  servicedAt: Date;

  @Prop({ type: String, default: '' })
  note: string;
}

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, lowercase: true, trim: true, default: null })
  email?: string | null;

  @Prop({ type: String, trim: true, default: null })
  phone?: string | null;

  @Prop({ type: String, enum: VendorCategory, required: true })
  category: VendorCategory;

  @Prop({ type: String, trim: true, default: null })
  address?: string | null;

  @Prop({ type: String, default: null })
  notes?: string | null;

  @Prop({
    type: [{ servicedAt: { type: Date, default: Date.now }, note: { type: String, default: '' } }],
    default: [],
  })
  serviceHistory: VendorServiceHistory[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
VendorSchema.index({ organizationId: 1, category: 1 });
