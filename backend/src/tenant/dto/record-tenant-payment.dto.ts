import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TenantPaymentStatus } from '../entities/tenant.entity';

export class RecordTenantPaymentDto {
  @ApiProperty({ example: '2026-05' })
  @IsString()
  monthKey: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ enum: TenantPaymentStatus })
  @IsOptional()
  @IsEnum(TenantPaymentStatus)
  status?: TenantPaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
