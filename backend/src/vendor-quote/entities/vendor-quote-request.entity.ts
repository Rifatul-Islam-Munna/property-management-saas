import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum VendorQuoteRequestStatus {
  OPEN = 'open',
  AWARDED = 'awarded',
  CLOSED = 'closed',
}

export enum VendorQuoteSubmissionStatus {
  SUBMITTED = 'submitted',
  SELECTED = 'selected',
  REJECTED = 'rejected',
}

@Schema({ _id: true, timestamps: true })
export class VendorQuoteSubmission {
  @Prop({ type: String, required: true, trim: true })
  vendorName: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  vendorEmail: string;

  @Prop({ type: String, trim: true, default: null })
  vendorPhone?: string | null;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: String, default: null })
  timeline?: string | null;

  @Prop({ type: String, default: null })
  proposalNote?: string | null;

  @Prop({ type: String, default: null })
  paymentTerms?: string | null;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: String, enum: VendorQuoteSubmissionStatus, default: VendorQuoteSubmissionStatus.SUBMITTED })
  status: VendorQuoteSubmissionStatus;

  @Prop({ type: Date, default: null })
  selectedAt?: Date | null;

  _id?: string;
}

export type VendorQuoteRequestDocument = HydratedDocument<VendorQuoteRequest>;

@Schema({ timestamps: true })
export class VendorQuoteRequest {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @Prop({ type: String, default: null, index: true })
  unitId?: string | null;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ type: Number, default: null, min: 0 })
  budgetAmount?: number | null;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: String, enum: VendorQuoteRequestStatus, default: VendorQuoteRequestStatus.OPEN, index: true })
  status: VendorQuoteRequestStatus;

  @Prop({ type: [VendorQuoteSubmission], default: [] })
  submissions: VendorQuoteSubmission[];

  @Prop({ type: String, default: null })
  selectedSubmissionId?: string | null;

  @Prop({ type: String, default: 'Hi {{vendor_name}}, your quote for {{request_title}} was selected. Amount: {{amount}} {{currency}}. Owner will contact you soon.' })
  winnerMessageTemplate: string;

  @Prop({ type: String, default: 'Hi {{vendor_name}}, thank you for quoting {{request_title}}. Owner selected another vendor this time.' })
  rejectionMessageTemplate: string;

  @Prop({ type: String, required: true })
  createdByUserId: string;

  @Prop({ type: String, trim: true, required: true })
  createdByName: string;

  @Prop({ type: String, enum: UserRole, required: true })
  createdByRole: UserRole;

  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const VendorQuoteRequestSchema = SchemaFactory.createForClass(VendorQuoteRequest);
VendorQuoteRequestSchema.index({ organizationId: 1, createdAt: -1 });
