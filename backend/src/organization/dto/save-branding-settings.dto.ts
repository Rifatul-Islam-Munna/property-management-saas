import { IsOptional, IsString } from 'class-validator';

export class SaveBrandingSettingsDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
