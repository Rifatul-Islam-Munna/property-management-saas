import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LeaveWorkerAssignmentDto {
  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @IsOptional()
  @IsString()
  ownerUserId?: string;
}
