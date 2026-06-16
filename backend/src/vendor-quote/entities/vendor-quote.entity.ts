import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum VendorQuoteStatus {
  REQUESTED = 'requested',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type VendorQuoteDocument = HydratedDocument<VendorQuote>;

@Schema({ timestamps: true })
export class VendorQuote {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  vendorId: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  unitId?: string | null;

  @ApiProperty()
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  description?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: Number, default: null, min: 0 })
  amount?: number | null;

  @ApiPropertyOptional()
  @Prop({ type: String, default: 'USD' })
  currency?: string | null;

  @ApiProperty({ enum: VendorQuoteStatus })
  @Prop({ type: String, enum: VendorQuoteStatus, default: VendorQuoteStatus.REQUESTED, index: true })
  status: VendorQuoteStatus;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  attachments: string[];

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  ownerNote?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: Date, default: null })
  approvedAt?: Date | null;

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

export const VendorQuoteSchema = SchemaFactory.createForClass(VendorQuote);
VendorQuoteSchema.index({ organizationId: 1, propertyId: 1, status: 1 });
VendorQuoteSchema.index({ organizationId: 1, vendorId: 1, createdAt: -1 });
