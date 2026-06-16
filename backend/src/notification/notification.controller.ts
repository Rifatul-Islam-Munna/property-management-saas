import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async getSettings(@Req() req: ExpressRequest): Promise<SuccessResponseDto> {
    const data = await this.notificationService.getSettings(req.user.organizationId ?? '');
    return new SuccessResponseDto(200, 'Notification settings fetched', data);
  }

  @Patch('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async saveSettings(@Req() req: ExpressRequest, @Body() dto: NotificationSettingsDto): Promise<SuccessResponseDto> {
    const data = await this.notificationService.saveSettings(req.user.organizationId ?? '', dto);
    return new SuccessResponseDto(200, 'Notification settings saved', data);
  }

  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async findTemplates(@Req() req: ExpressRequest): Promise<SuccessResponseDto> {
    const data = await this.notificationService.findTemplates(req.user.organizationId ?? '');
    return new SuccessResponseDto(200, 'Notification templates fetched', data);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async createTemplate(@Req() req: ExpressRequest, @Body() dto: CreateNotificationTemplateDto): Promise<SuccessResponseDto> {
    const data = await this.notificationService.createTemplate(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Notification template created', data);
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async updateTemplate(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.notificationService.updateTemplate(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Notification template updated', data);
  }

  @Post('send-template')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER)
  async sendTemplate(@Req() req: ExpressRequest, @Body() dto: SendTemplateDto): Promise<SuccessResponseDto> {
    const data = await this.notificationService.sendTemplate(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(200, 'Notification queued', data);
  }
}
