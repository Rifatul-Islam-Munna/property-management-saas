import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AiProviderKind } from '../entities/ai-provider-config.entity';

export class CreateAiProviderConfigDto {
  @ApiProperty({ enum: AiProviderKind, example: AiProviderKind.OPENAI })
  @IsEnum(AiProviderKind)
  provider: AiProviderKind;

  @ApiProperty({ example: 'Resident helper - GPT' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'org_abc123' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({ example: 'gpt-5' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ example: 'https://api.openai.com' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ example: 'sk-live-...' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'Resident support AI. Keep answers short.' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ example: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: { 'HTTP-Referer': 'https://example.com' } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: { notes: 'future-safe metadata' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
