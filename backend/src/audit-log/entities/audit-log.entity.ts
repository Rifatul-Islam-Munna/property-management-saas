import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  action: string;

  @Prop({ type: String, required: true, index: true })
  entityType: string;

  @Prop({ type: String, default: null, index: true })
  entityId?: string | null;

  @Prop({ type: String, default: null })
  actorId?: string | null;

  @Prop({ type: String, default: null })
  actorName?: string | null;

  @Prop({ type: String, default: null })
  actorRole?: string | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
