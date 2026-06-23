import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitVendorMarketplaceQuoteDto {
  @IsString()
  vendorName: string;

  @IsEmail()
  vendorEmail: string;

  @IsOptional()
  @IsString()
  vendorPhone?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  proposalNote?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
