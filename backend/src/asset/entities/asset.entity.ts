import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum AssetStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export type AssetDocument = HydratedDocument<Asset>;

@Schema({ timestamps: true })
export class Asset {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  unitId?: string | null;

  @ApiProperty()
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ type: String, required: true, trim: true, index: true })
  category: string;

  @ApiPropertyOptional()
  @Prop({ type: String, trim: true, default: null })
  serialNumber?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, trim: true, default: null })
  model?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: Date, default: null })
  purchaseDate?: Date | null;

  @ApiPropertyOptional()
  @Prop({ type: Date, default: null, index: true })
  warrantyEnd?: Date | null;

  @ApiPropertyOptional()
  @Prop({ type: Date, default: null })
  lastServiceAt?: Date | null;

  @ApiPropertyOptional()
  @Prop({ type: Date, default: null, index: true })
  nextServiceAt?: Date | null;

  @ApiProperty({ enum: AssetStatus })
  @Prop({ type: String, enum: AssetStatus, default: AssetStatus.ACTIVE, index: true })
  status: AssetStatus;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  documents: string[];

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  notes?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @ApiPropertyOptional({ enum: UserRole })
  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
AssetSchema.index({ organizationId: 1, propertyId: 1, status: 1 });
AssetSchema.index({ organizationId: 1, nextServiceAt: 1 });
