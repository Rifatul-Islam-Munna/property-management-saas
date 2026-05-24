import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateRecurringMaintenanceDto } from './dto/create-recurring-maintenance.dto';
import { QueryRecurringMaintenanceDto } from './dto/query-recurring-maintenance.dto';
import { UpdateRecurringMaintenanceDto } from './dto/update-recurring-maintenance.dto';
import { RecurringMaintenanceService } from './recurring-maintenance.service';

@ApiTags('recurring-maintenance')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('recurring-maintenance')
export class RecurringMaintenanceController {
  constructor(private readonly recurringService: RecurringMaintenanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateRecurringMaintenanceDto): Promise<SuccessResponseDto<any>> {
    const data = await this.recurringService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Recurring maintenance created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryRecurringMaintenanceDto): Promise<SuccessResponseDto<any>> {
    const data = await this.recurringService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Recurring maintenance list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.recurringService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Recurring maintenance fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateRecurringMaintenanceDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.recurringService.update(req.user.organizationId ?? '', id, dto);
    return new SuccessResponseDto(200, 'Recurring maintenance updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.recurringService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Recurring maintenance deleted successfully', data);
  }
}
