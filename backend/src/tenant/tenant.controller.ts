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

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Get('me')
  async findCurrentTenantProfile(
    @Req() req: ExpressRequest,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.findCurrentTenantProfile(
      req.user.organizationId ?? '',
      req.user.id,
      req.user.email,
    );
    return new SuccessResponseDto(200, 'Current tenant profile fetched', data);
  }

  @Roles(UserRole.RENTER, UserRole.GUEST)
  @Post('leave')
  async leaveCurrentTenantProfile(
    @Req() req: ExpressRequest,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.leaveCurrentTenantProfile(
      req.user.organizationId ?? '',
      req.user.id,
      req.user.email,
    );
    return new SuccessResponseDto(200, 'Tenant profile left successfully', data);
  }

  @Roles(UserRole.RENTER, UserRole.GUEST)
  @Patch('me/profile-image')
  async updateCurrentProfileImage(
    @Req() req: ExpressRequest,
    @Body() dto: { profileImage: string },
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.updateCurrentProfileImage(
      req.user.organizationId ?? '',
      req.user,
      dto.profileImage,
    );
    return new SuccessResponseDto(200, 'Tenant profile image updated', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Post()
  async create(
    @Req() req: ExpressRequest,
    @Body() dto: CreateTenantDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.tenantService.create(
      req.user.organizationId ?? '',
      req.user.id,
      req.user,
      dto,
    );
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
      req.user.id,
      req.user,
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
      req.user,
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
