import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty()
  @IsString()
  content: string;
}
