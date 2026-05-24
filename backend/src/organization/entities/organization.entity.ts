import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  STARTER = 'starter',
  GROWTH = 'growth',
  ENTERPRISE = 'enterprise',
}

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ timestamps: true })
export class Organization {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'Acme Properties' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'acme-properties' })
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @ApiPropertyOptional({ example: 'info@acme.com' })
  @Prop({ type: String, lowercase: true, trim: true, default: null })
  email?: string | null;

  @ApiPropertyOptional({ example: '+1234567890' })
  @Prop({ type: String, trim: true, default: null })
  phone?: string | null;

  @ApiPropertyOptional({ example: '123 Main St, City, State' })
  @Prop({ type: String, default: null })
  address?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @Prop({ type: String, default: null })
  logo?: string | null;

  @ApiPropertyOptional({ example: 'A property management company' })
  @Prop({ type: String, default: null })
  description?: string | null;

  @ApiPropertyOptional({ example: {} })
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.TRIAL })
  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.STARTER })
  @Prop({ type: String, enum: SubscriptionPlan, default: SubscriptionPlan.STARTER })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({ example: 5 })
  @Prop({ type: Number, default: 5 })
  maxProperties: number;

  @ApiProperty({ example: 10 })
  @Prop({ type: Number, default: 10 })
  maxUsers: number;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, required: true, index: true })
  ownerId: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
