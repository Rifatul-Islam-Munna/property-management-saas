import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageRoomType } from '../entities/message.entity';

export class SendMessageDto {
  @ApiProperty({ enum: MessageRoomType })
  @IsEnum(MessageRoomType)
  roomType: MessageRoomType;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
