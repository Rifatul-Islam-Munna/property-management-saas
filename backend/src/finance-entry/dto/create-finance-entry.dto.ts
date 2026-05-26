import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FinanceEntryKind, FinanceEntryStatus } from '../entities/finance-entry.entity';

export class CreateFinanceEntryDto {
  @ApiProperty({ enum: FinanceEntryKind })
  @IsEnum(FinanceEntryKind)
  kind: FinanceEntryKind;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: FinanceEntryStatus })
  @IsOptional()
  @IsEnum(FinanceEntryStatus)
  status?: FinanceEntryStatus;

  @ApiProperty()
  @IsDateString()
  occurredAt: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
