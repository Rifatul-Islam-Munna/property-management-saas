import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PlanDocAccess } from '../entities/plan-doc.entity';

class UpdatePlanDocShareItemDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty({ enum: PlanDocAccess })
  @IsEnum(PlanDocAccess)
  access: PlanDocAccess;
}

export class UpdatePlanDocShareDto {
  @ApiProperty({ type: [UpdatePlanDocShareItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlanDocShareItemDto)
  sharedWith: UpdatePlanDocShareItemDto[];
}
