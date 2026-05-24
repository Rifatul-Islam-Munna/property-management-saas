import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../lib/pagination.dto';
import { UnitStatus } from '../entities/unit.entity';

export class QueryUnitDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'prop_xyz789' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ enum: UnitStatus, example: UnitStatus.VACANT })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional({ example: 'A-101', description: 'Search by unit number' })
  @IsOptional()
  @IsString()
  search?: string;
}
