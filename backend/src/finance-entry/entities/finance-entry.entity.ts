import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum FinanceEntryKind {
  EARNING = 'earning',
  EXPENSE = 'expense',
}

export enum FinanceEntryStatus {
  PENDING = 'pending',
  CLEARED = 'cleared',
  CANCELED = 'canceled',
}

export type FinanceEntryDocument = HydratedDocument<FinanceEntry>;

@Schema({ timestamps: true })
export class FinanceEntry {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty({ enum: FinanceEntryKind })
  @Prop({ type: String, enum: FinanceEntryKind, required: true, index: true })
  kind: FinanceEntryKind;

  @ApiProperty({ example: 'Gas refill' })
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  description?: string | null;

  @ApiProperty({ example: 'utility' })
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  category: string;

  @ApiProperty({ example: 5000 })
  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @Prop({ type: String, default: 'USD' })
  currency?: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  propertyId?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  unitId?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  tenantId?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  billId?: string | null;

  @ApiPropertyOptional({ example: 'manual' })
  @Prop({ type: String, default: 'manual' })
  source?: string | null;

  @ApiProperty({ enum: FinanceEntryStatus })
  @Prop({ type: String, enum: FinanceEntryStatus, default: FinanceEntryStatus.CLEARED, index: true })
  status: FinanceEntryStatus;

  @ApiProperty({ example: '2026-05-26T00:00:00.000Z' })
  @Prop({ type: Date, required: true, index: true })
  occurredAt: Date;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  attachments?: string[];

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  note?: string | null;

  @ApiProperty()
  @Prop({ type: String, required: true })
  createdBy: string;

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

export const FinanceEntrySchema = SchemaFactory.createForClass(FinanceEntry);
FinanceEntrySchema.index({ organizationId: 1, kind: 1, occurredAt: -1 });
FinanceEntrySchema.index({ organizationId: 1, propertyId: 1, occurredAt: -1 });
