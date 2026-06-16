import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTemplateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  templateId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tenantIds: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: Array<'email' | 'sms'>;
}
