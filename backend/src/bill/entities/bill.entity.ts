import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum BillKind {
  RENT = 'rent',
  EXTRA = 'extra',
  UTILITY = 'utility',
  GUEST_FEE = 'guest_fee',
  CUSTOM = 'custom',
}

export enum BillStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'partial',
  WAIVED = 'waived',
  OVERDUE = 'overdue',
}

export type BillDocument = HydratedDocument<Bill>;

@Schema({ timestamps: true })
export class Bill {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  tenantId: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  recipientUserId?: string | null;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, index: true })
  unitId?: string | null;

  @ApiProperty({ enum: BillKind, example: BillKind.RENT })
  @Prop({ type: String, enum: BillKind, default: BillKind.CUSTOM, index: true })
  kind: BillKind;

  @ApiProperty({ example: 'July rent' })
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @ApiPropertyOptional({ example: 'Gas line repair charge' })
  @Prop({ type: String, default: null })
  description?: string | null;

  @ApiProperty({ example: 15000 })
  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @Prop({ type: String, default: 'USD' })
  currency?: string;

  @ApiPropertyOptional({ example: '2026-05' })
  @Prop({ type: String, default: null, index: true })
  monthKey?: string | null;

  @ApiPropertyOptional({ example: '2026-06-05T00:00:00.000Z' })
  @Prop({ type: Date, default: null, index: true })
  dueDate?: Date | null;

  @ApiProperty({ enum: BillStatus, example: BillStatus.UNPAID })
  @Prop({ type: String, enum: BillStatus, default: BillStatus.UNPAID, index: true })
  status: BillStatus;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  attachments: string[];

  @ApiPropertyOptional({ example: 'Shared with renter account' })
  @Prop({ type: String, default: null })
  note?: string | null;

  @ApiPropertyOptional({ example: '2026-06-07T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @ApiPropertyOptional({ example: 'manual' })
  @Prop({ type: String, default: 'manual' })
  paymentMode?: string | null;

  @ApiPropertyOptional({ example: 'pay_tok_123' })
  @Prop({ type: String, default: null, index: true })
  paymentToken?: string | null;

  @ApiPropertyOptional({ example: 'open' })
  @Prop({ type: String, default: null })
  stripeCheckoutStatus?: string | null;

  @ApiPropertyOptional({ example: 'cs_test_123' })
  @Prop({ type: String, default: null, index: true })
  stripeCheckoutSessionId?: string | null;

  @ApiPropertyOptional({ example: 'pi_123' })
  @Prop({ type: String, default: null })
  stripePaymentIntentId?: string | null;

  @ApiPropertyOptional({ example: 'in_123' })
  @Prop({ type: String, default: null })
  stripeInvoiceId?: string | null;

  @ApiPropertyOptional({ example: 'https://...' })
  @Prop({ type: String, default: null })
  stripeInvoicePdf?: string | null;

  @ApiPropertyOptional({ example: 'https://...' })
  @Prop({ type: String, default: null })
  stripeHostedInvoiceUrl?: string | null;

  @ApiPropertyOptional({ example: 'card' })
  @Prop({ type: String, default: null })
  stripePaymentMethodType?: string | null;

  @ApiPropertyOptional({ example: '2026-06-07T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  paymentVerifiedAt?: Date | null;

  @ApiProperty()
  @Prop({ type: String, required: true })
  createdBy: string;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
BillSchema.index({ organizationId: 1, tenantId: 1, createdAt: -1 });
BillSchema.index({ organizationId: 1, propertyId: 1, status: 1 });
