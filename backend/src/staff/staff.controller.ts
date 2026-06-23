import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateStaffDto, PayStaffDto, SendStaffMessageDto } from './dto/create-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateStaffDto) {
    const data = await this.staffService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Staff created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryStaffDto) {
    const data = await this.staffService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Staff list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.staffService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Staff fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string, @Body() dto: UpdateStaffDto) {
    const data = await this.staffService.update(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Staff updated successfully', data);
  }

  @Post(':id/pay')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async pay(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string, @Body() dto: PayStaffDto) {
    const data = await this.staffService.pay(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Staff payment recorded', data);
  }

  @Post(':id/message')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async sendMessage(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string, @Body() dto: SendStaffMessageDto) {
    const data = await this.staffService.sendMessage(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Staff message sent', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.staffService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Staff deleted successfully', data);
  }
}
