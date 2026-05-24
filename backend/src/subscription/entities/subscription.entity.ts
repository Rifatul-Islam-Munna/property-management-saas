import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BillingInterval } from './plan.entity';

export enum SubscriptionStatusRecord {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  ownerUserId: string;

  @Prop({ type: String, required: true })
  planId: string;

  @Prop({ type: String, enum: BillingInterval, required: true })
  billingInterval: BillingInterval;

  @Prop({ type: String, enum: SubscriptionStatusRecord, default: SubscriptionStatusRecord.PENDING })
  status: SubscriptionStatusRecord;

  @Prop({ type: String, default: null })
  paddleTransactionId?: string | null;

  @Prop({ type: Date, default: null })
  currentPeriodStart?: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodEnd?: Date | null;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ organizationId: 1, status: 1 });
