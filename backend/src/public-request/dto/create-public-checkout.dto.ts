import { IsOptional, IsString } from 'class-validator';

export class CreatePublicCheckoutDto {
  @IsOptional()
  @IsString()
  billId?: string;

  @IsOptional()
  @IsString()
  monthKey?: string;

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}
