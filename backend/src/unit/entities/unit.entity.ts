import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export enum UnitStatus {
  VACANT = 'vacant',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export type UnitDocument = HydratedDocument<Unit>;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Unit {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'org_abc123' })
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty({ example: 'prop_xyz789' })
  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @ApiProperty({ example: 'A-101' })
  @Prop({ type: String, required: true, trim: true })
  unitNumber: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @Prop({ type: Number, default: 0 })
  floor: number;

  @ApiPropertyOptional({ example: '2bhk' })
  @Prop({ type: String, trim: true, default: null })
  type: string | null;

  @ApiProperty({ enum: UnitStatus, example: UnitStatus.VACANT, default: UnitStatus.VACANT })
  @Prop({ type: String, enum: UnitStatus, default: UnitStatus.VACANT })
  status: UnitStatus;

  @ApiPropertyOptional({ example: 'tenant_abc123' })
  @Prop({ type: String, default: null })
  tenantId: string | null;

  @ApiPropertyOptional({ example: 15000 })
  @Prop({ type: Number, default: null })
  monthlyRent: number | null;

  @ApiPropertyOptional({ example: 850 })
  @Prop({ type: Number, default: null })
  area: number | null;

  @ApiPropertyOptional({ example: 'Corner unit with balcony' })
  @Prop({ type: String, trim: true, default: null })
  notes: string | null;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/unit1.jpg'] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiPropertyOptional({ example: ['wifi', 'parking', 'gym'] })
  @Prop({ type: [String], default: [] })
  amenities: string[];

  @ApiProperty({ example: true, default: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

UnitSchema.index({ organizationId: 1, propertyId: 1 });
UnitSchema.index({ organizationId: 1, status: 1 });
UnitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });
