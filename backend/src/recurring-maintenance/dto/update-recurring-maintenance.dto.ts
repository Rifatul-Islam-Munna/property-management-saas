import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateRecurringMaintenanceDto } from './create-recurring-maintenance.dto';
import { ApprovalStatus } from '../entities/recurring-maintenance.entity';

export class UpdateRecurringMaintenanceDto extends PartialType(CreateRecurringMaintenanceDto) {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @IsOptional()
  @IsString()
  approvalNote?: string;
}
