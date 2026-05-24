import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';

export class LinkGlobalUserDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: ['property_1', 'property_2'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  propertyIds?: string[];
}
