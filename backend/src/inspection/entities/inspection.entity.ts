import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum InspectionType {
  MOVE_IN = 'move_in',
  MOVE_OUT = 'move_out',
  ROUTINE = 'routine',
}

export enum ApprovalStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type InspectionDocument = HydratedDocument<Inspection>;

@Schema({ timestamps: true })
export class Inspection {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  propertyId: string;

  @Prop({ type: String, default: null })
  unitId?: string | null;

  @Prop({ type: String, enum: InspectionType, required: true })
  type: InspectionType;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({ type: [String], default: [] })
  checklist: string[];

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: String, default: null, index: true })
  assignedTo?: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  estimatedCost?: number | null;

  @Prop({ type: Number, default: 0, min: 0 })
  actualCost?: number | null;

  @Prop({ type: String, default: 'usd' })
  currency?: string | null;

  @Prop({ type: String, enum: ['unpaid', 'paid'], default: 'unpaid' })
  paymentStatus?: 'unpaid' | 'paid';

  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @Prop({ type: String, default: null })
  damageReport?: string | null;

  @Prop({ type: String, default: null })
  notes?: string | null;

  @Prop({ type: String, default: null })
  workerReport?: string | null;

  @Prop({ type: [String], default: [] })
  workerReportFiles: string[];

  @Prop({ type: Date, default: null })
  workerReportedAt?: Date | null;

  @Prop({ type: String, default: null })
  workerReportedBy?: string | null;

  @Prop({ type: Boolean, default: false })
  completed: boolean;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.NOT_SUBMITTED, index: true })
  approvalStatus: ApprovalStatus;

  @Prop({ type: Date, default: null })
  approvalRequestedAt?: Date | null;

  @Prop({ type: String, default: null })
  approvalNote?: string | null;

  @Prop({ type: String, default: null })
  approvedBy?: string | null;

  @Prop({ type: Date, default: null })
  approvedAt?: Date | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const InspectionSchema = SchemaFactory.createForClass(Inspection);
