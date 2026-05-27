import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export type TenantDocument = HydratedDocument<Tenant>;

export enum TenantKind {
  RENTER = 'renter',
  GUEST = 'guest',
}

export enum TenantPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
}

@Schema({ _id: false })
export class EmergencyContact {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @Prop({ type: String, trim: true, default: null })
  name?: string | null;

  @ApiPropertyOptional({ example: '01800000000' })
  @Prop({ type: String, trim: true, default: null })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Spouse' })
  @Prop({ type: String, trim: true, default: null })
  relationship?: string | null;
}

@Schema({ _id: false })
export class TenantPaymentRecord {
  @ApiProperty({ example: '2026-05' })
  @Prop({ type: String, required: true })
  monthKey: string;

  @ApiProperty({ enum: TenantPaymentStatus, example: TenantPaymentStatus.PAID })
  @Prop({ type: String, enum: TenantPaymentStatus, default: TenantPaymentStatus.PENDING })
  status: TenantPaymentStatus;

  @ApiProperty({ example: 15000 })
  @Prop({ type: Number, required: true })
  amount: number;

  @ApiPropertyOptional({ example: '2026-05-05T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  @ApiPropertyOptional({ example: 'cash' })
  @Prop({ type: String, default: null })
  paymentMethod?: string | null;

  @ApiPropertyOptional({ example: 'bill_abc123' })
  @Prop({ type: String, default: null })
  billId?: string | null;

  @ApiPropertyOptional({ example: 'cs_test_123' })
  @Prop({ type: String, default: null })
  stripeCheckoutSessionId?: string | null;

  @ApiPropertyOptional({ example: 'pi_123' })
  @Prop({ type: String, default: null })
  stripePaymentIntentId?: string | null;

  @ApiPropertyOptional({ example: 'in_123' })
  @Prop({ type: String, default: null })
  stripeInvoiceId?: string | null;

  @ApiPropertyOptional({ example: 'https://invoice.stripe.com/...' })
  @Prop({ type: String, default: null })
  stripeHostedInvoiceUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://files.stripe.com/...' })
  @Prop({ type: String, default: null })
  stripeInvoicePdf?: string | null;

  @ApiPropertyOptional({ example: 'partial carry' })
  @Prop({ type: String, default: null })
  note?: string | null;
}

@Schema({ timestamps: true })
export class Tenant {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'org_abc123' })
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiPropertyOptional({ example: 'user_abc123' })
  @Prop({ type: String, default: null })
  userId?: string | null;

  @ApiProperty({ example: 'property_abc123' })
  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @ApiPropertyOptional({ example: 'unit_abc123' })
  @Prop({ type: String, default: null })
  unitId?: string | null;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ required: true, trim: true })
  fullName: string;

  @ApiProperty({ enum: TenantKind, example: TenantKind.RENTER })
  @Prop({ type: String, enum: TenantKind, default: TenantKind.RENTER })
  tenantKind: TenantKind;

  @ApiProperty({ example: 'john@example.com' })
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @ApiProperty({ example: '01700000000' })
  @Prop({ required: true, trim: true })
  phone: string;

  @ApiPropertyOptional({ type: EmergencyContact })
  @Prop({ type: EmergencyContact, default: null })
  emergencyContact?: EmergencyContact | null;

  @ApiPropertyOptional({ example: '123 Main St, Dhaka' })
  @Prop({ type: String, trim: true, default: null })
  address?: string | null;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  leaseStart?: Date | null;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  leaseEnd?: Date | null;

  @ApiPropertyOptional({ example: 15000 })
  @Prop({ type: Number, default: null })
  monthlyRent?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @Prop({ type: Number, default: null, min: 1, max: 31 })
  rentDueDay?: number | null;

  @ApiPropertyOptional({ example: 30000 })
  @Prop({ type: Number, default: null })
  securityDeposit?: number | null;

  @ApiPropertyOptional({ example: 5000 })
  @Prop({ type: Number, default: null })
  oneTimeGuestFee?: number | null;

  @ApiPropertyOptional({ example: false })
  @Prop({ type: Boolean, default: false })
  guestFeePaid?: boolean;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/doc1.pdf'] })
  @Prop({ type: [String], default: [] })
  documents: string[];

  @ApiPropertyOptional({ type: [TenantPaymentRecord] })
  @Prop({
    type: [
      {
        monthKey: { type: String, required: true },
        status: {
          type: String,
          enum: TenantPaymentStatus,
          default: TenantPaymentStatus.PENDING,
        },
        amount: { type: Number, required: true },
        paidAt: { type: Date, default: null },
        dueDate: { type: Date, default: null },
        paymentMethod: { type: String, default: null },
        billId: { type: String, default: null },
        stripeCheckoutSessionId: { type: String, default: null },
        stripePaymentIntentId: { type: String, default: null },
        stripeInvoiceId: { type: String, default: null },
        stripeHostedInvoiceUrl: { type: String, default: null },
        stripeInvoicePdf: { type: String, default: null },
        note: { type: String, default: null },
      },
    ],
    default: [],
  })
  paymentRecords: TenantPaymentRecord[];

  @ApiPropertyOptional({ example: 'Preferred top floor' })
  @Prop({ type: String, default: null })
  notes?: string | null;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  movedInAt?: Date | null;

  @ApiPropertyOptional({ example: null })
  @Prop({ type: Date, default: null })
  movedOutAt?: Date | null;

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

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ organizationId: 1, propertyId: 1 });
TenantSchema.index({ organizationId: 1, email: 1 });
TenantSchema.index({ organizationId: 1, unitId: 1 });
