import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { BillingInterval } from '../entities/plan.entity';

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
}
