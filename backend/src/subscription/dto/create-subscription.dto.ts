import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { BillingInterval } from '../entities/plan.entity';
import { SubscriptionStatusRecord } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  planId: string;

  @ApiProperty({ enum: BillingInterval })
  @IsEnum(BillingInterval)
  billingInterval: BillingInterval;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatusRecord })
  @IsOptional()
  @IsEnum(SubscriptionStatusRecord)
  status?: SubscriptionStatusRecord;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;
}
