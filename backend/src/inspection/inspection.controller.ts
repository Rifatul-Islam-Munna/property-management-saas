import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { QueryInspectionDto } from './dto/query-inspection.dto';
import { ReportInspectionDto } from './dto/report-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionService } from './inspection.service';

@ApiTags('inspection')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('inspection')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateInspectionDto): Promise<SuccessResponseDto<any>> {
    const data = await this.inspectionService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Inspection created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryInspectionDto): Promise<SuccessResponseDto<any>> {
    const scopedQuery =
      req.user.role === UserRole.WORKER ? { ...query, assignedTo: req.user.id } : query;
    const data = await this.inspectionService.findAll(req.user.organizationId ?? '', scopedQuery);
    return new SuccessResponseDto(200, 'Inspection list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.inspectionService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Inspection fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateInspectionDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.inspectionService.update(req.user.organizationId ?? '', id, dto);
    return new SuccessResponseDto(200, 'Inspection updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.inspectionService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Inspection deleted successfully', data);
  }

  @Patch(':id/report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async submitReport(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: ReportInspectionDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.inspectionService.submitReport(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Inspection report submitted successfully', data);
  }
}
