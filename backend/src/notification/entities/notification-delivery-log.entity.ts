import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDeliveryLogDocument = HydratedDocument<NotificationDeliveryLog>;

@Schema({ timestamps: true })
export class NotificationDeliveryLog {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  triggerKey: string;

  @Prop({ type: String, required: true, index: true })
  recipientId: string;

  @Prop({ type: String, required: true })
  channel: 'email' | 'sms';

  @Prop({ type: String, required: true })
  status: 'queued' | 'sent' | 'failed';

  @Prop({ type: String, default: null })
  error?: string | null;
}

export const NotificationDeliveryLogSchema = SchemaFactory.createForClass(NotificationDeliveryLog);
NotificationDeliveryLogSchema.index({ organizationId: 1, triggerKey: 1, recipientId: 1, channel: 1 }, { unique: true });
