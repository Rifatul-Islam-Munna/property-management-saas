import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/lib/pagination.dto';
import { VendorQuoteStatus } from '../entities/vendor-quote.entity';

export class QueryVendorQuoteDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ enum: VendorQuoteStatus })
  @IsOptional()
  @IsEnum(VendorQuoteStatus)
  status?: VendorQuoteStatus;
}
