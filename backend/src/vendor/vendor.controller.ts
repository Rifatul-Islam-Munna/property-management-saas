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
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorService } from './vendor.service';

@ApiTags('vendor')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateVendorDto) {
    const data = await this.vendorService.create(req.user.organizationId ?? '', dto);
    return new SuccessResponseDto(201, 'Vendor created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryVendorDto) {
    const data = await this.vendorService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Vendor list fetched', data);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.vendorService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Vendor fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    const data = await this.vendorService.update(req.user.organizationId ?? '', id, dto);
    return new SuccessResponseDto(200, 'Vendor updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.vendorService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Vendor deleted successfully', data);
  }
}
