import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../lib/pagination.dto';
import { TechnicianAvailability } from '../entities/technician.entity';

export class QueryTechnicianDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: TechnicianAvailability,
    description: 'Filter by availability status',
  })
  @IsOptional()
  @IsEnum(TechnicianAvailability)
  availability?: TechnicianAvailability;

  @ApiPropertyOptional({ description: 'Filter by skill (e.g. plumbing)' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned property ID' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
