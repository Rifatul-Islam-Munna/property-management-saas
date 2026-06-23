import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVendorMarketplaceRequestDto {
  @IsString()
  propertyId: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  winnerMessageTemplate?: string;

  @IsOptional()
  @IsString()
  rejectionMessageTemplate?: string;
}
