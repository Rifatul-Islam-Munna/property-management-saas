import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../lib/pagination.dto';
import { TenantKind } from '../entities/tenant.entity';

export class QueryTenantDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by propertyId' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Filter by unitId' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TenantKind })
  @IsOptional()
  @IsEnum(TenantKind)
  tenantKind?: TenantKind;

  @ApiPropertyOptional({ description: 'Check paid status for month, format YYYY-MM' })
  @IsOptional()
  @IsString()
  paymentMonth?: string;

  @ApiPropertyOptional({ description: 'true = paid, false = unpaid for paymentMonth' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  paidThisMonth?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
