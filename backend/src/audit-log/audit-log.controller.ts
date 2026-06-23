import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type ExpressRequest } from 'src/lib/auth.guard';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { AuditLogService } from './audit-log.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async findAll(
    @Req() req: ExpressRequest,
    @Query() query: { page?: number; limit?: number; entityType?: string },
  ) {
    const data = await this.auditLogService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Audit logs fetched', data);
  }
}
