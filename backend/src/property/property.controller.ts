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
import { CreatePropertyDto } from './dto/create-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyService } from './property.service';

@ApiTags('property')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Post()
  async create(
    @Req() req: ExpressRequest,
    @Body() dto: CreatePropertyDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.propertyService.create(
      req.user.organizationId ?? '',
      req.user,
      dto,
    );
    return new SuccessResponseDto(201, 'Property created successfully', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Get()
  async findAll(
    @Req() req: ExpressRequest,
    @Query() query: QueryPropertyDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.propertyService.findAll(
      req.user.organizationId ?? '',
      query,
    );
    return new SuccessResponseDto(200, 'Properties fetched successfully', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Get(':id')
  async findById(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.propertyService.findById(
      req.user.organizationId ?? '',
      id,
    );
    return new SuccessResponseDto(200, 'Property fetched successfully', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Patch(':id')
  async update(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.propertyService.update(
      req.user.organizationId ?? '',
      req.user,
      id,
      dto,
    );
    return new SuccessResponseDto(200, 'Property updated successfully', data);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  async remove(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.propertyService.remove(
      req.user.organizationId ?? '',
      id,
    );
    return new SuccessResponseDto(200, 'Property deleted successfully', data);
  }
}
