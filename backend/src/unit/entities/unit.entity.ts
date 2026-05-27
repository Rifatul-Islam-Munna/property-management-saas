import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum UnitStatus {
  VACANT = 'vacant',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export type UnitDocument = HydratedDocument<Unit>;

@Schema({ _id: false })
export class UnitExtraChargeTemplate {
  @ApiProperty({ example: 'Gas bill' })
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @ApiProperty({ example: 500 })
  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @ApiPropertyOptional({ example: 'monthly' })
  @Prop({ type: String, default: 'monthly' })
  frequency?: string | null;

  @ApiPropertyOptional({ example: 'Meter-based' })
  @Prop({ type: String, default: null })
  note?: string | null;
}

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

  @ApiPropertyOptional({ type: [UnitExtraChargeTemplate] })
  @Prop({
    type: [
      {
        title: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        frequency: { type: String, default: 'monthly' },
        note: { type: String, default: null },
      },
    ],
    default: [],
  })
  extraChargeTemplates: UnitExtraChargeTemplate[];

  @ApiProperty({ example: true, default: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @ApiPropertyOptional({ example: 'Jane Owner' })
  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TETENTWONER })
  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

UnitSchema.index({ organizationId: 1, propertyId: 1 });
UnitSchema.index({ organizationId: 1, status: 1 });
UnitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });
