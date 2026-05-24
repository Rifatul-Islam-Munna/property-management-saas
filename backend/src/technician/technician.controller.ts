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
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { QueryTechnicianDto } from './dto/query-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { TechnicianService } from './technician.service';

@ApiTags('technician')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('technician')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(
    @Req() req: ExpressRequest,
    @Body() dto: CreateTechnicianDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.technicianService.create(
      req.user.organizationId ?? '',
      req.user.id,
      dto,
    );
    return new SuccessResponseDto(201, 'Technician created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(
    @Req() req: ExpressRequest,
    @Query() query: QueryTechnicianDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.technicianService.findAll(
      req.user.organizationId ?? '',
      query,
    );
    return new SuccessResponseDto(200, 'Technician list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findById(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.technicianService.findById(
      req.user.organizationId ?? '',
      id,
    );
    return new SuccessResponseDto(200, 'Technician fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTechnicianDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.technicianService.update(
      req.user.organizationId ?? '',
      id,
      dto,
    );
    return new SuccessResponseDto(200, 'Technician updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.technicianService.remove(
      req.user.organizationId ?? '',
      id,
    );
    return new SuccessResponseDto(200, 'Technician deleted successfully', data);
  }
}
