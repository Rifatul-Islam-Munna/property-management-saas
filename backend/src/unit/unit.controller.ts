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
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { QueryUnitDto } from './dto/query-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitService } from './unit.service';

@ApiTags('unit')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('unit')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  async create(
    @Req() req: ExpressRequest,
    @Body() dto: CreateUnitDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.unitService.create(req.user.organizationId ?? '', dto);
    return new SuccessResponseDto(201, 'Unit created successfully', data);
  }

  @Get()
  async findAll(
    @Req() req: ExpressRequest,
    @Query() query: QueryUnitDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.unitService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Unit list fetched', data);
  }

  @Get(':id')
  async findById(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.unitService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Unit fetched', data);
  }

  @Patch(':id')
  async update(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.unitService.update(req.user.organizationId ?? '', id, dto);
    return new SuccessResponseDto(200, 'Unit updated', data);
  }

  @Delete(':id')
  async remove(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.unitService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Unit deleted', data);
  }
}
