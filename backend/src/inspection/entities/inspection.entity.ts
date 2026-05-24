import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum InspectionType {
  MOVE_IN = 'move_in',
  MOVE_OUT = 'move_out',
  ROUTINE = 'routine',
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

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: String, required: true })
  createdBy: string;
}

export const InspectionSchema = SchemaFactory.createForClass(Inspection);
