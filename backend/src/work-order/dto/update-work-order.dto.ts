import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateWorkOrderDto } from './create-work-order.dto';
import { WorkApprovalStatus } from '../entities/work-order.entity';

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {
  @IsOptional()
  @IsEnum(WorkApprovalStatus)
  approvalStatus?: WorkApprovalStatus;

  @IsOptional()
  @IsString()
  approvalNote?: string;
}
