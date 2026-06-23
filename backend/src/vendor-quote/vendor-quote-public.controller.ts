import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { SubmitVendorMarketplaceQuoteDto } from './dto/submit-vendor-marketplace-quote.dto';
import { VendorQuoteService } from './vendor-quote.service';

@Controller('public-vendor-quote')
export class VendorQuotePublicController {
  constructor(private readonly vendorQuoteService: VendorQuoteService) {}

  @Get(':id')
  async getPublicMarketplaceRequest(@Param('id') id: string): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.getPublicMarketplaceRequest(id);
    return new SuccessResponseDto(200, 'Vendor marketplace request fetched', data);
  }

  @Post(':id/submissions')
  async submitPublicMarketplaceQuote(
    @Param('id') id: string,
    @Body() dto: SubmitVendorMarketplaceQuoteDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.submitPublicMarketplaceQuote(id, dto);
    return new SuccessResponseDto(201, 'Vendor quote submitted', data);
  }
}
