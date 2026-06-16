import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum TicketCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  CLEANING = 'cleaning',
  APPLIANCE = 'appliance',
  SECURITY = 'security',
  INTERNET = 'internet',
  STRUCTURAL = 'structural',
  GENERAL = 'general',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum TicketStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
}

export enum TicketApprovalStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class TicketComment {
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export class TicketNote {
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export class TicketTimelineEntry {
  action: string;
  performedBy: string;
  performedAt: Date;
  details: string;
}

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Ticket {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @Prop({ type: String, default: null })
  unitId?: string;

  @Prop({ type: String, default: null })
  tenantId?: string;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, enum: TicketCategory, required: true })
  category: TicketCategory;

  @Prop({ type: String, enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ type: String, enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ type: String, default: null })
  assignedTo?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments: TicketComment[];

  @Prop({
    type: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  internalNotes: TicketNote[];

  @Prop({
    type: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        performedAt: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
    default: [],
  })
  timeline: TicketTimelineEntry[];

  @Prop({ type: Date, default: null })
  resolvedAt?: Date;

  @Prop({ type: Date, default: null })
  scheduledDate?: Date;

  @Prop({ type: Date, default: null })
  dueDate?: Date;

  @Prop({ type: Number, default: null })
  estimatedCost?: number;

  @Prop({ type: Number, default: null })
  actualCost?: number;

  @Prop({ type: String, default: null })
  completionNotes?: string;

  @Prop({ type: [String], default: [] })
  completionProof?: string[];

  @Prop({ type: String, enum: TicketApprovalStatus, default: TicketApprovalStatus.NOT_SUBMITTED, index: true })
  approvalStatus: TicketApprovalStatus;

  @Prop({ type: Date, default: null })
  approvalRequestedAt?: Date | null;

  @Prop({ type: String, default: null })
  approvalNote?: string | null;

  @Prop({ type: String, default: null })
  approvedBy?: string | null;

  @Prop({ type: Date, default: null })
  approvedAt?: Date | null;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
TicketSchema.index({ organizationId: 1, status: 1 });
TicketSchema.index({ organizationId: 1, priority: 1 });
TicketSchema.index({ organizationId: 1, assignedTo: 1 });
TicketSchema.index({ organizationId: 1, propertyId: 1 });
