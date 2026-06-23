import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from 'src/ticket/entities/ticket.entity';

export class UpdatePublicTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  completionNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
