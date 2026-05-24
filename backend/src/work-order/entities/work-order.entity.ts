import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TicketPriority } from 'src/ticket/entities/ticket.entity';

export enum WorkOrderStatus {
  OPEN = 'open',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type WorkOrderDocument = HydratedDocument<WorkOrder>;

@Schema({ timestamps: true })
export class WorkOrder {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @Prop({ type: String, default: null })
  unitId?: string | null;

  @Prop({ type: String, default: null })
  ticketId?: string | null;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, default: null })
  assignedTo?: string | null;

  @Prop({ type: Date, default: null })
  scheduledDate?: Date | null;

  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  @Prop({ type: String, enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ type: String, enum: WorkOrderStatus, default: WorkOrderStatus.OPEN })
  status: WorkOrderStatus;

  @Prop({ type: String, default: null })
  completionNotes?: string | null;

  @Prop({ type: [String], default: [] })
  completionProof: string[];

  @Prop({ type: String, default: null })
  verifiedBy?: string | null;

  @Prop({ type: Date, default: null })
  verifiedAt?: Date | null;

  @Prop({ type: String, required: true })
  createdBy: string;
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);
WorkOrderSchema.index({ organizationId: 1, propertyId: 1 });
WorkOrderSchema.index({ organizationId: 1, assignedTo: 1 });
