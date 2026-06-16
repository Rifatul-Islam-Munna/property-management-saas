import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateInspectionDto } from './create-inspection.dto';
import { ApprovalStatus } from '../entities/inspection.entity';

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @IsOptional()
  @IsString()
  approvalNote?: string;
}
