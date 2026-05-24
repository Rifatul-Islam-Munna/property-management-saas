import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum MessageRoomType {
  TICKET = 'ticket',
  DIRECT = 'direct',
}

export enum MessageKind {
  TEXT = 'text',
  DOCUMENT = 'document',
}

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, enum: MessageRoomType, required: true })
  roomType: MessageRoomType;

  @Prop({ type: String, required: true, index: true })
  roomId: string;

  @Prop({ type: String, required: true, index: true })
  senderId: string;

  @Prop({ type: [String], default: [] })
  recipientIds: string[];

  @Prop({ type: String, required: true })
  senderName: string;

  @Prop({ type: String, enum: MessageKind, default: MessageKind.TEXT })
  kind: MessageKind;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [String], default: [] })
  readBy: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ organizationId: 1, roomId: 1, createdAt: -1 });
