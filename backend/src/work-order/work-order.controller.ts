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
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrderService } from './work-order.service';

@ApiTags('work-order')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('work-order')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateWorkOrderDto) {
    const data = await this.workOrderService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Work order created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryWorkOrderDto) {
    const scopedQuery =
      req.user.role === UserRole.WORKER ? { ...query, assignedTo: req.user.id } : query;
    const data = await this.workOrderService.findAll(req.user.organizationId ?? '', scopedQuery);
    return new SuccessResponseDto(200, 'Work order list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.workOrderService.findById(req.user.organizationId ?? '', req.user, id);
    return new SuccessResponseDto(200, 'Work order fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    const data = await this.workOrderService.update(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Work order updated successfully', data);
  }

  @Patch(':id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async verify(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.workOrderService.verify(req.user.organizationId ?? '', id, req.user);
    return new SuccessResponseDto(200, 'Work order verified successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.workOrderService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Work order deleted successfully', data);
  }
}
