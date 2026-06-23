import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { CreatePublicCheckoutDto } from './dto/create-public-checkout.dto';
import { CreatePublicTicketDto } from './dto/create-public-ticket.dto';
import { UpdatePublicTicketDto } from './dto/update-public-ticket.dto';
import { VerifyPublicCheckoutDto } from './dto/verify-public-checkout.dto';
import { PublicRequestService } from './public-request.service';

@Controller('public-request')
export class PublicRequestController {
  constructor(private readonly publicRequestService: PublicRequestService) {}

  @Get('tenant/:tenantId')
  async getTenantPortal(@Param('tenantId') tenantId: string) {
    const data = await this.publicRequestService.getTenantPortal(tenantId);
    return new SuccessResponseDto(200, 'Public tenant portal fetched', data);
  }

  @Post('tenant/:tenantId/stripe-checkout')
  async createCheckout(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePublicCheckoutDto,
  ) {
    const data = await this.publicRequestService.createCheckout(tenantId, dto);
    return new SuccessResponseDto(200, 'Public Stripe checkout created', data);
  }

  @Post('tenant/:tenantId/stripe-verify')
  async verifyCheckout(
    @Param('tenantId') tenantId: string,
    @Body() dto: VerifyPublicCheckoutDto,
  ) {
    const data = await this.publicRequestService.verifyCheckout(tenantId, dto);
    return new SuccessResponseDto(200, 'Public Stripe payment verified', data);
  }

  @Post('tenant/:tenantId/tickets')
  async createTicket(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePublicTicketDto,
  ) {
    const data = await this.publicRequestService.createTicket(tenantId, dto);
    return new SuccessResponseDto(201, 'Public ticket created', data);
  }

  @Get('ticket/:ticketId')
  async getTicket(@Param('ticketId') ticketId: string) {
    const data = await this.publicRequestService.getTicket(ticketId);
    return new SuccessResponseDto(200, 'Public ticket fetched', data);
  }

  @Patch('ticket/:ticketId')
  async updateTicket(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdatePublicTicketDto,
  ) {
    const data = await this.publicRequestService.updateTicket(ticketId, dto);
    return new SuccessResponseDto(200, 'Public ticket updated', data);
  }
}
