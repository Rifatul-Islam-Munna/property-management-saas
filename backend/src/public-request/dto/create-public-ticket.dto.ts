import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketCategory, TicketPriority } from 'src/ticket/entities/ticket.entity';

export class CreatePublicTicketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
