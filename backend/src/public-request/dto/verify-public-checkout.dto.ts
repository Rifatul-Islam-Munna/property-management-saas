import { IsString } from 'class-validator';

export class VerifyPublicCheckoutDto {
  @IsString()
  billId: string;

  @IsString()
  sessionId: string;

  @IsString()
  token: string;
}
