import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AiProviderKind } from '../entities/ai-provider-config.entity';

export class QueryAiProviderConfigDto {
  @ApiPropertyOptional({ enum: AiProviderKind })
  @IsOptional()
  @IsEnum(AiProviderKind)
  provider?: AiProviderKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  enabled?: string;
}
