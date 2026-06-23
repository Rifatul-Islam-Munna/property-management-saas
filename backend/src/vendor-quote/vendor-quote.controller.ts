import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateVendorMarketplaceRequestDto } from './dto/create-vendor-marketplace-request.dto';
import { CreateVendorQuoteDto } from './dto/create-vendor-quote.dto';
import { QueryVendorQuoteDto } from './dto/query-vendor-quote.dto';
import { SubmitVendorMarketplaceQuoteDto } from './dto/submit-vendor-marketplace-quote.dto';
import { UpdateVendorQuoteDto } from './dto/update-vendor-quote.dto';
import { VendorQuoteService } from './vendor-quote.service';

@ApiTags('vendor-quote')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('vendor-quote')
export class VendorQuoteController {
  constructor(private readonly vendorQuoteService: VendorQuoteService) {}

  @Post('marketplace-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async createMarketplaceRequest(
    @Req() req: ExpressRequest,
    @Body() dto: CreateVendorMarketplaceRequestDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.createMarketplaceRequest(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Vendor marketplace request created', data);
  }

  @Get('marketplace-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findMarketplaceRequests(@Req() req: ExpressRequest): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.findMarketplaceRequests(req.user.organizationId ?? '');
    return new SuccessResponseDto(200, 'Vendor marketplace requests fetched', data);
  }

  @Get('marketplace-requests/public/:id')
  async getPublicMarketplaceRequest(@Param('id') id: string): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.getPublicMarketplaceRequest(id);
    return new SuccessResponseDto(200, 'Vendor marketplace request fetched', data);
  }

  @Post('marketplace-requests/public/:id/submissions')
  async submitPublicMarketplaceQuote(
    @Param('id') id: string,
    @Body() dto: SubmitVendorMarketplaceQuoteDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.submitPublicMarketplaceQuote(id, dto);
    return new SuccessResponseDto(201, 'Vendor quote submitted', data);
  }

  @Patch('marketplace-requests/:id/select/:submissionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async selectMarketplaceSubmission(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Param('submissionId') submissionId: string,
  ): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.selectMarketplaceSubmission(req.user.organizationId ?? '', req.user, id, submissionId);
    return new SuccessResponseDto(200, 'Vendor submission selected', data);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateVendorQuoteDto): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Vendor quote created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryVendorQuoteDto): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Vendor quote list fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateVendorQuoteDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.update(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Vendor quote updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto> {
    const data = await this.vendorQuoteService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Vendor quote deleted successfully', data);
  }
}
