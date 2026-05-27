import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatWithAiDto {
  @ApiProperty({ example: 'Water leaking from kitchen sink. Help me open request.' })
  @IsString()
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ example: 'sess_abc123' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
