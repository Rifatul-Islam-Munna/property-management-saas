import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { RecordTenantPaymentDto } from './dto/record-tenant-payment.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';

@ApiTags('tenant')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Post()
  async create(
    @Req() req: ExpressRequest,
    @Body() dto: CreateTenantDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.create(req.user.organizationId ?? '', dto);
    return new SuccessResponseDto(201, 'Tenant created successfully', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Get()
  async findAll(
    @Req() req: ExpressRequest,
    @Query() query: QueryTenantDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.findAll(
      req.user.organizationId ?? '',
      query,
    );
    return new SuccessResponseDto(200, 'Tenant list fetched', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Get(':id')
  async findById(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.findById(
      req.user.organizationId ?? '',
      id,
    );
    return new SuccessResponseDto(200, 'Tenant fetched', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Patch(':id')
  async update(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.update(
      req.user.organizationId ?? '',
      id,
      dto,
    );
    return new SuccessResponseDto(200, 'Tenant updated', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Post(':id/payments')
  async recordPayment(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: RecordTenantPaymentDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.recordPayment(
      req.user.organizationId ?? '',
      id,
      dto,
    );
    return new SuccessResponseDto(200, 'Tenant payment recorded', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Delete(':id')
  async remove(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Tenant deleted', data);
  }
}
