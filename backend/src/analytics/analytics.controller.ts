import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async dashboard(@Req() req: ExpressRequest, @Query('propertyId') propertyId?: string) {
    const data = await this.analyticsService.getDashboard(req.user.organizationId ?? '', propertyId);
    return new SuccessResponseDto(200, 'Dashboard analytics fetched', data);
  }

  @Get('tickets')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async ticketStats(@Req() req: ExpressRequest, @Query('propertyId') propertyId?: string) {
    const data = await this.analyticsService.getTicketStats(req.user.organizationId ?? '', propertyId);
    return new SuccessResponseDto(200, 'Ticket analytics fetched', data);
  }

  @Get('occupancy')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async occupancy(@Req() req: ExpressRequest, @Query('propertyId') propertyId?: string) {
    const data = await this.analyticsService.getOccupancyStats(req.user.organizationId ?? '', propertyId);
    return new SuccessResponseDto(200, 'Occupancy analytics fetched', data);
  }

  @Get('technicians')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async technicians(@Req() req: ExpressRequest) {
    const data = await this.analyticsService.getTechnicianStats(req.user.organizationId ?? '');
    return new SuccessResponseDto(200, 'Technician analytics fetched', data);
  }
}
