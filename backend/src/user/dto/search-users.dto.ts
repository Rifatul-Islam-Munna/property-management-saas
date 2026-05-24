import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class SearchUsersDto {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST, UserRole.TETENTWONER],
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
