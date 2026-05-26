import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { QueryBillDto } from './dto/query-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@ApiTags('bill')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateBillDto): Promise<SuccessResponseDto> {
    const data = await this.billService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Bill created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryBillDto): Promise<SuccessResponseDto> {
    const data = await this.billService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Bill list fetched', data);
  }

  @Get('my')
  @Roles(UserRole.RENTER, UserRole.GUEST)
  async findMy(@Req() req: ExpressRequest): Promise<SuccessResponseDto> {
    const data = await this.billService.findMyBills(req.user.organizationId ?? '', req.user);
    return new SuccessResponseDto(200, 'Resident bill list fetched', data);
  }

  @Post('my/monthly-checkout')
  @Roles(UserRole.RENTER, UserRole.GUEST)
  async createMyMonthlyStripeCheckout(
    @Req() req: ExpressRequest,
    @Body() dto: { monthKey: string; successUrl: string; cancelUrl: string },
  ): Promise<SuccessResponseDto> {
    const data = await this.billService.createResidentMonthlyStripeCheckout(
      req.user.organizationId ?? '',
      req.user,
      dto.monthKey,
      dto.successUrl,
      dto.cancelUrl,
    );
    return new SuccessResponseDto(200, 'Resident monthly checkout created', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.RENTER, UserRole.GUEST)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto> {
    const data = await this.billService.findById(req.user.organizationId ?? '', req.user, id);
    return new SuccessResponseDto(200, 'Bill fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string, @Body() dto: UpdateBillDto): Promise<SuccessResponseDto> {
    const data = await this.billService.update(req.user.organizationId ?? '', id, dto);
    return new SuccessResponseDto(200, 'Bill updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto> {
    const data = await this.billService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Bill deleted successfully', data);
  }

  @Post(':id/stripe-checkout')
  @Roles(UserRole.RENTER, UserRole.GUEST)
  async createStripeCheckout(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: { successUrl: string; cancelUrl: string },
  ): Promise<SuccessResponseDto> {
    const data = await this.billService.createStripeCheckout(
      req.user.organizationId ?? '',
      req.user,
      id,
      dto.successUrl,
      dto.cancelUrl,
    );
    return new SuccessResponseDto(200, 'Stripe checkout created', data);
  }

  @Post(':id/stripe-verify')
  @Roles(UserRole.RENTER, UserRole.GUEST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async verifyStripeCheckout(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: { sessionId: string; token: string },
  ): Promise<SuccessResponseDto> {
    const data = await this.billService.verifyStripeCheckout(
      req.user.organizationId ?? '',
      req.user,
      id,
      dto.sessionId,
      dto.token,
    );
    return new SuccessResponseDto(200, 'Stripe payment verified', data);
  }
}
