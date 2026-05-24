import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TicketPriority } from 'src/ticket/entities/ticket.entity';
import { UserRole } from 'src/user/entities/user.entity';

export enum AnnouncementType {
  GENERAL = 'general',
  EMERGENCY = 'emergency',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  NOTICE = 'notice',
}

export enum NoticeAudience {
  ALL = 'all',
  ROLE_BASED = 'role_based',
  USER_BASED = 'user_based',
}

export type AnnouncementDocument = HydratedDocument<Announcement>;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, default: null, index: true })
  propertyId?: string | null;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, enum: AnnouncementType, default: AnnouncementType.GENERAL })
  type: AnnouncementType;

  @Prop({ type: String, enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ type: String, enum: NoticeAudience, default: NoticeAudience.ALL })
  audience: NoticeAudience;

  @Prop({ type: [String], enum: UserRole, default: [] })
  targetRoles: UserRole[];

  @Prop({ type: [String], default: [] })
  targetUserIds: string[];

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date, default: null })
  scheduledAt?: Date | null;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ organizationId: 1, propertyId: 1 });
