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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { SaveStripeSettingsDto } from './dto/save-stripe-settings.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(
    @Req() req: ExpressRequest,
    @Body() dto: CreateOrganizationDto,
  ): Promise<any> {
    return this.organizationService.create(req.user.id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll(@Query() query: QueryOrganizationDto): Promise<any> {
    return this.organizationService.findAll(query);
  }

  @Get('my')
  async findMy(@Req() req: ExpressRequest): Promise<SuccessResponseDto<any[]>> {
    const data = await this.organizationService.findByOwnerId(req.user.id);
    return new SuccessResponseDto(200, 'Owner organizations fetched', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  @Get('my/stripe-settings')
  async getMyStripeSettings(@Req() req: ExpressRequest): Promise<SuccessResponseDto<any>> {
    const data = await this.organizationService.getStripeSettingsStatus(req.user.organizationId ?? '');
    return new SuccessResponseDto(200, 'Stripe settings fetched', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  @Patch('my/stripe-settings')
  async saveMyStripeSettings(@Req() req: ExpressRequest, @Body() dto: SaveStripeSettingsDto): Promise<SuccessResponseDto<any>> {
    const data = await this.organizationService.saveStripeSettings(req.user.organizationId ?? '', dto);
    return new SuccessResponseDto(200, 'Stripe settings saved', data);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<any> {
    return this.organizationService.findById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<any> {
    return this.organizationService.update(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.organizationService.remove(id);
  }
}
