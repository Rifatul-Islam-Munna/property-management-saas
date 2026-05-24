import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/lib/pagination.dto';
import { MessageRoomType } from '../entities/message.entity';

export class QueryMessageDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MessageRoomType })
  @IsOptional()
  @IsEnum(MessageRoomType)
  roomType?: MessageRoomType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;
}
