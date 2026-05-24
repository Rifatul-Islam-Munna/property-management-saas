import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  AssignmentRequestDirection,
} from '../entities/assignment-request.entity';
import { UserRole } from '../entities/user.entity';

export class CreateAssignmentRequestDto {
  @ApiProperty({ enum: AssignmentRequestDirection })
  @IsEnum(AssignmentRequestDirection)
  direction: AssignmentRequestDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @ApiProperty({ enum: [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST] })
  @IsEnum(UserRole)
  requestedRole: UserRole.WORKER | UserRole.RENTER | UserRole.GUEST;

  @ApiPropertyOptional({ example: ['property_1'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  propertyIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
