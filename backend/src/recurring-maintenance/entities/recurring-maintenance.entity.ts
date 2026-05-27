import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum RecurringFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export type RecurringMaintenanceDocument = HydratedDocument<RecurringMaintenance>;

export enum RecurringReportStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Schema({ _id: false })
export class RecurringRunReport {
  @Prop({ type: String, enum: RecurringReportStatus, default: RecurringReportStatus.COMPLETED })
  status: RecurringReportStatus;

  @Prop({ type: String, default: null })
  note?: string | null;

  @Prop({ type: [String], default: [] })
  files: string[];

  @Prop({ type: Date, default: Date.now })
  reportedAt: Date;

  @Prop({ type: String, required: true })
  reportedBy: string;
}

@Schema({ timestamps: true })
export class RecurringMaintenance {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  propertyId: string;

  @Prop({ type: String, default: null })
  unitId?: string | null;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, enum: RecurringFrequency, required: true })
  frequency: RecurringFrequency;

  @Prop({ type: Date, required: true })
  nextRunAt: Date;

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

  @Prop({
    type: [
      {
        status: {
          type: String,
          enum: RecurringReportStatus,
          default: RecurringReportStatus.COMPLETED,
        },
        note: { type: String, default: null },
        files: { type: [String], default: [] },
        reportedAt: { type: Date, default: Date.now },
        reportedBy: { type: String, required: true },
      },
    ],
    default: [],
  })
  runHistory: RecurringRunReport[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;
}

export const RecurringMaintenanceSchema = SchemaFactory.createForClass(RecurringMaintenance);
