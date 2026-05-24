import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum RecurringFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export type RecurringMaintenanceDocument = HydratedDocument<RecurringMaintenance>;

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

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;
}

export const RecurringMaintenanceSchema = SchemaFactory.createForClass(RecurringMaintenance);
