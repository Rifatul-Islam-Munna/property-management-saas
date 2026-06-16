import { PartialType } from '@nestjs/swagger';
import { CreateVendorQuoteDto } from './create-vendor-quote.dto';

export class UpdateVendorQuoteDto extends PartialType(CreateVendorQuoteDto) {}
