import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from './user.entity';

export enum AssignmentRequestDirection {
  OWNER_TO_USER = 'owner_to_user',
  USER_TO_OWNER = 'user_to_owner',
}

export enum AssignmentRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export type AssignmentRequestDocument = HydratedDocument<AssignmentRequest>;

@Schema({ timestamps: true })
export class AssignmentRequest {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: AssignmentRequestDirection })
  @Prop({ type: String, enum: AssignmentRequestDirection, required: true })
  direction: AssignmentRequestDirection;

  @ApiProperty({ enum: AssignmentRequestStatus })
  @Prop({
    type: String,
    enum: AssignmentRequestStatus,
    default: AssignmentRequestStatus.PENDING,
  })
  status: AssignmentRequestStatus;

  @ApiProperty({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, required: true, index: true })
  requesterUserId: string;

  @ApiProperty({ enum: UserRole })
  @Prop({ type: String, enum: UserRole, required: true })
  requesterRole: UserRole;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a12' })
  @Prop({ type: String, default: null, index: true })
  targetUserId?: string | null;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @Prop({ type: String, trim: true, lowercase: true, default: null })
  targetEmail?: string | null;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a13' })
  @Prop({ type: String, default: null, index: true })
  ownerUserId?: string | null;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a14' })
  @Prop({ type: String, default: null, index: true })
  organizationId?: string | null;

  @ApiProperty({ enum: [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST] })
  @Prop({ type: String, enum: [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST], required: true })
  requestedRole: UserRole.WORKER | UserRole.RENTER | UserRole.GUEST;

  @ApiPropertyOptional({ example: ['property_1'] })
  @Prop({ type: [String], default: [] })
  propertyIds: string[];

  @ApiPropertyOptional({ example: 'Join our building as renter' })
  @Prop({ type: String, trim: true, default: null })
  message?: string | null;
}

export const AssignmentRequestSchema =
  SchemaFactory.createForClass(AssignmentRequest);
