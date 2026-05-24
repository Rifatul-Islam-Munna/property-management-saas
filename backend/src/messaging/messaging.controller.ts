import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { MessagingService } from './messaging.service';
import { QueryMessageDto } from './dto/query-message.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('messages')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async send(@Req() req: ExpressRequest, @Body() dto: SendMessageDto): Promise<SuccessResponseDto<any>> {
    const data = await this.messagingService.sendMessage(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Message sent successfully', data);
  }

  @Post('documents')
  @Roles(UserRole.ADMIN, UserRole.TETENTWONER)
  async sendDocument(
    @Req() req: ExpressRequest,
    @Body() dto: SendDocumentDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.messagingService.sendDocumentToUsers(
      req.user.organizationId ?? '',
      req.user,
      dto,
    );
    return new SuccessResponseDto(201, 'Document sent successfully', data);
  }

  @Get('messages')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryMessageDto): Promise<SuccessResponseDto<any>> {
    const data = await this.messagingService.findMessages(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Messages fetched', data);
  }

  @Patch('messages/:id/read')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async markRead(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.messagingService.markRead(req.user.organizationId ?? '', id, req.user.id);
    return new SuccessResponseDto(200, 'Message marked as read', data);
  }
}
