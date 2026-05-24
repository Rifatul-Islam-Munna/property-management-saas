import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendDocumentDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recipientIds: string[];

  @ApiProperty()
  @IsString()
  documentUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
