import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('asset')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('asset')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async create(@Req() req: ExpressRequest, @Body() dto: CreateAssetDto): Promise<SuccessResponseDto> {
    const data = await this.assetService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Asset created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryAssetDto): Promise<SuccessResponseDto> {
    const data = await this.assetService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Asset list fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateAssetDto,
  ): Promise<SuccessResponseDto> {
    const data = await this.assetService.update(req.user.organizationId ?? '', req.user, id, dto);
    return new SuccessResponseDto(200, 'Asset updated successfully', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto> {
    const data = await this.assetService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Asset deleted successfully', data);
  }
}
