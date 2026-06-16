import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class NotificationSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overdueRentEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  overdueRentDaysAfterDue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  overdueRentRepeatEveryDays?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  overdueRentChannels?: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overdueRentTemplateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inspectionEnabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inspectionChannels?: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspectionTemplateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recurringMaintenanceEnabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recurringMaintenanceChannels?: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recurringMaintenanceTemplateId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenantCreatedChannels?: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantCreatedTemplateId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workerCreatedChannels?: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workerCreatedTemplateId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noticeCreatedChannels?: Array<'email' | 'sms'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noticeCreatedTemplateId?: string;
}
