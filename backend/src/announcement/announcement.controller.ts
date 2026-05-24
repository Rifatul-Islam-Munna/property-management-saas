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
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('announcement')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateAnnouncementDto) {
    const data = await this.announcementService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Announcement created successfully', data);
  }

  @Post('notice')
  @Roles(UserRole.ADMIN, UserRole.TETENTWONER)
  async sendNotice(@Req() req: ExpressRequest, @Body() dto: CreateAnnouncementDto) {
    const data = await this.announcementService.sendNoticeToTenantUsers(
      req.user.organizationId ?? '',
      req.user,
      dto,
    );
    return new SuccessResponseDto(201, 'Notice sent successfully', data);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryAnnouncementDto) {
    const data = await this.announcementService.findAll(
      req.user.organizationId ?? '',
      query,
      req.user,
    );
    return new SuccessResponseDto(200, 'Announcement list fetched', data);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.announcementService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Announcement fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    const data = await this.announcementService.update(req.user.organizationId ?? '', id, dto);
    return new SuccessResponseDto(200, 'Announcement updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.announcementService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Announcement deleted successfully', data);
  }
}
