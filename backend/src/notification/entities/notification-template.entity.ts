import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export type NotificationTemplateDocument = HydratedDocument<NotificationTemplate>;

@Schema({ timestamps: true })
export class NotificationTemplate {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty()
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null, trim: true })
  subject?: string | null;

  @ApiProperty()
  @Prop({ type: String, required: true })
  body: string;

  @ApiPropertyOptional()
  @Prop({ type: [String], default: ['email'] })
  channels: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  purpose?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @ApiPropertyOptional()
  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @ApiPropertyOptional({ enum: UserRole })
  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(NotificationTemplate);
NotificationTemplateSchema.index({ organizationId: 1, purpose: 1 });
