import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { RecurringReportStatus } from '../entities/recurring-maintenance.entity';

export class ReportRecurringMaintenanceDto {
  @ApiPropertyOptional({ enum: RecurringReportStatus })
  @IsOptional()
  @IsEnum(RecurringReportStatus)
  status?: RecurringReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}
