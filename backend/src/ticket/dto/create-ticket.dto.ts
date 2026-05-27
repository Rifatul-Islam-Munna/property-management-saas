import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  TicketCategory,
  TicketPriority,
} from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ example: 'property_123' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ example: 'unit_456' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ example: 'tenant_789' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ example: 'Leaking faucet in kitchen' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'The kitchen faucet has been dripping continuously.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.PLUMBING })
  @IsNotEmpty()
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/img1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '2026-06-03T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 150.0 })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}
