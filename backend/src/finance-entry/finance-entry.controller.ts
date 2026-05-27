import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateFinanceEntryDto } from './dto/create-finance-entry.dto';
import { QueryFinanceEntryDto } from './dto/query-finance-entry.dto';
import { UpdateFinanceEntryDto } from './dto/update-finance-entry.dto';
import { FinanceEntryService } from './finance-entry.service';

@ApiTags('finance-entry')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('finance-entry')
export class FinanceEntryController {
  constructor(private readonly financeEntryService: FinanceEntryService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateFinanceEntryDto): Promise<SuccessResponseDto> {
    const data = await this.financeEntryService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Finance entry created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryFinanceEntryDto): Promise<SuccessResponseDto> {
    const data = await this.financeEntryService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Finance entry list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto> {
    const data = await this.financeEntryService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Finance entry fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string, @Body() dto: UpdateFinanceEntryDto): Promise<SuccessResponseDto> {
    const data = await this.financeEntryService.update(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Finance entry updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto> {
    const data = await this.financeEntryService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Finance entry deleted successfully', data);
  }
}
