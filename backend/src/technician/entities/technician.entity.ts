import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export enum TechnicianAvailability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  OFF_DUTY = 'off_duty',
}

export type TechnicianDocument = HydratedDocument<Technician>;

@Schema({ timestamps: true })
export class Technician {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'org_abc123' })
  @Prop({ type: String, default: null, index: true })
  organizationId?: string | null;

  @ApiPropertyOptional({ example: ['org_abc123', 'org_xyz789'] })
  @Prop({ type: [String], default: [] })
  organizationIds: string[];

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null, index: true })
  userId?: string | null;

  @ApiPropertyOptional({ example: ['6650dc1f31d889f2435b2a11'] })
  @Prop({ type: [String], default: [], index: true })
  ownerIds: string[];

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null })
  activeOwnerId?: string | null;

  @ApiProperty({ example: 'John Smith' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'john.smith@example.com' })
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @ApiProperty({ example: '+1-555-0199' })
  @Prop({ required: true, trim: true })
  phone: string;

  @ApiPropertyOptional({ example: ['plumbing', 'electrical', 'hvac'] })
  @Prop({ type: [String], default: [] })
  skills: string[];

  @ApiPropertyOptional({
    enum: TechnicianAvailability,
    example: TechnicianAvailability.AVAILABLE,
  })
  @Prop({
    type: String,
    enum: TechnicianAvailability,
    default: TechnicianAvailability.AVAILABLE,
  })
  availability: TechnicianAvailability;

  @ApiPropertyOptional({ example: ['property_1', 'property_2'] })
  @Prop({ type: [String], default: [] })
  assignedProperties: string[];

  @ApiPropertyOptional({ example: 45.5 })
  @Prop({ type: Number, default: null })
  hourlyRate?: number | null;

  @ApiPropertyOptional({ example: 'Specializes in emergency repairs' })
  @Prop({ type: String, trim: true, default: null })
  notes?: string | null;

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: true })
  isGlobalTechnician: boolean;

  @ApiPropertyOptional({ example: '2026-01-15T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  joinedAt?: Date | null;
}

export const TechnicianSchema = SchemaFactory.createForClass(Technician);
TechnicianSchema.index({ organizationId: 1, availability: 1 });
TechnicianSchema.index({ organizationId: 1, isActive: 1 });
TechnicianSchema.index({ userId: 1 }, { unique: true, sparse: true });
