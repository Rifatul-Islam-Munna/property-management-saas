import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: String, trim: true, default: '' })
  description: string;

  @Prop({ type: Number, required: true })
  monthlyPrice: number;

  @Prop({ type: Number, required: true })
  yearlyPrice: number;

  @Prop({ type: Number, default: 1 })
  maxProperties: number;

  @Prop({ type: Number, default: 5 })
  maxUsers: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  paddleProductId?: string | null;

  @Prop({ type: String, default: null })
  paddlePriceIdMonthly?: string | null;

  @Prop({ type: String, default: null })
  paddlePriceIdYearly?: string | null;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
