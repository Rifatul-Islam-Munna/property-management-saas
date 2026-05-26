import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SaveStripeSettingsDto {
  @ApiPropertyOptional({ example: 'sk_test_...' })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ example: 'pk_test_...' })
  @IsOptional()
  @IsString()
  publishableKey?: string;

  @ApiPropertyOptional({ example: 'usd' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;
}
