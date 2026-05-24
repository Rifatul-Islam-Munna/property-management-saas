import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TETENTWONER = 'tetentwoner',
  WORKER = 'worker',
  RENTER = 'renter',
  GUEST = 'guest',
}

export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum OwnerSubscriptionTier {
  STARTER = 'starter',
  GROWTH = 'growth',
  ENTERPRISE = 'enterprise',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ required: true, trim: true })
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @ApiProperty({ example: '01700000000' })
  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'org_abc123' })
  @Prop({ type: String, trim: true, default: null, index: true })
  organizationId?: string | null;

  @ApiPropertyOptional({ example: ['org_abc123', 'org_xyz789'] })
  @Prop({ type: [String], default: [] })
  organizationIds: string[];

  @ApiPropertyOptional({ example: 'Property Manager' })
  @Prop({ type: String, trim: true, default: null })
  jobTitle?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @Prop({ type: String, trim: true, default: null })
  avatarUrl?: string | null;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, select: false, default: null })
  refreshToken?: string | null;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null, index: true })
  createdByUserId?: string | null;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMIN })
  @Prop({ type: String, enum: UserRole, default: null })
  createdByRole?: UserRole | null;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null, index: true })
  firstAddedByOwnerId?: string | null;

  @ApiPropertyOptional({ example: ['6650dc1f31d889f2435b2a11'] })
  @Prop({ type: [String], default: [], index: true })
  ownerIds: string[];

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null })
  activeOwnerId?: string | null;

  @ApiPropertyOptional({ example: ['property_1', 'property_2'] })
  @Prop({ type: [String], default: [] })
  propertyIds: string[];

  @ApiPropertyOptional({ example: 'property_1' })
  @Prop({ type: String, default: null })
  activePropertyId?: string | null;

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: false })
  isGlobalProfile: boolean;

  @ApiPropertyOptional({ enum: OwnerSubscriptionTier, example: OwnerSubscriptionTier.STARTER })
  @Prop({ type: String, enum: OwnerSubscriptionTier, default: null })
  subscriptionTier?: OwnerSubscriptionTier | null;

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: false })
  subscriptionRequired: boolean;

  @ApiPropertyOptional({ example: false })
  @Prop({ type: Boolean, default: false })
  subscriptionActive: boolean;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  subscriptionStartsAt?: Date | null;

  @ApiPropertyOptional({ example: '2027-06-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  subscriptionEndsAt?: Date | null;

  @ApiProperty({ enum: UserRole, example: UserRole.GUEST })
  @Prop({ type: String, enum: UserRole, default: UserRole.GUEST })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ example: '2026-05-24T13:44:00.000Z' })
  @Prop({ type: Date, default: null })
  lastLoginAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ ownerIds: 1, role: 1 });
