import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class McpRpcDto {
  @ApiProperty({ example: '2.0' })
  @IsString()
  jsonrpc: string;

  @ApiProperty({ example: '1' })
  id: string | number;

  @ApiProperty({ example: 'tools/list' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
