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
import { CreatePlanDocDto } from './dto/create-plan-doc.dto';
import { QueryPlanDocDto } from './dto/query-plan-doc.dto';
import { UpdatePlanDocShareDto } from './dto/update-plan-doc-share.dto';
import { UpdatePlanDocDto } from './dto/update-plan-doc.dto';
import { PlanDocService } from './plan-doc.service';

@ApiTags('plan-doc')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('plan-doc')
export class PlanDocController {
  constructor(private readonly planDocService: PlanDocService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Post()
  async create(@Req() req: ExpressRequest, @Body() dto: CreatePlanDocDto) {
    const data = await this.planDocService.create(req.user, dto);
    return new SuccessResponseDto(201, 'Plan created successfully', data);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Get()
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryPlanDocDto) {
    const data = await this.planDocService.findAll(req.user, query);
    return new SuccessResponseDto(200, 'Plans fetched successfully', data);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Get('share-candidates')
  async findShareCandidates(
    @Req() req: ExpressRequest,
    @Query('search') search?: string,
  ) {
    const data = await this.planDocService.findShareCandidates(req.user, search);
    return new SuccessResponseDto(200, 'Plan share users fetched successfully', data);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Get(':id')
  async findById(@Req() req: ExpressRequest, @Param('id') id: string) {
    const data = await this.planDocService.findById(req.user, id);
    return new SuccessResponseDto(200, 'Plan fetched successfully', data);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Patch(':id')
  async update(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDocDto,
  ) {
    const data = await this.planDocService.update(req.user, id, dto);
    return new SuccessResponseDto(200, 'Plan updated successfully', data);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Patch(':id/share')
  async updateShare(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDocShareDto,
  ) {
    const data = await this.planDocService.updateShare(req.user, id, dto);
    return new SuccessResponseDto(200, 'Plan share updated successfully', data);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  @Delete(':id')
  async remove(@Req() req: ExpressRequest, @Param('id') id: string) {
    const data = await this.planDocService.remove(req.user, id);
    return new SuccessResponseDto(200, 'Plan deleted successfully', data);
  }
}
