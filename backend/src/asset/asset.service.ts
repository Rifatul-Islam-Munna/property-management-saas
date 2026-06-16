import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreateAssetDto } from './dto/create-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset, AssetDocument } from './entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateAssetDto): Promise<any> {
    const asset = await this.assetModel.create({
      ...dto,
      organizationId,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : null,
      lastServiceAt: dto.lastServiceAt ? new Date(dto.lastServiceAt) : null,
      nextServiceAt: dto.nextServiceAt ? new Date(dto.nextServiceAt) : null,
      images: dto.images ?? [],
      documents: dto.documents ?? [],
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    return asset.toObject();
  }

  async findAll(organizationId: string, query: QueryAssetDto): Promise<any> {
    const { page = 1, limit = 20, propertyId, unitId, category, status, search } = query;
    const filter: Record<string, unknown> = { organizationId };
    if (propertyId) filter.propertyId = propertyId;
    if (unitId) filter.unitId = unitId;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.assetModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).lean(),
      this.assetModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateAssetDto): Promise<any> {
    const asset = await this.assetModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : dto.purchaseDate,
        warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : dto.warrantyEnd,
        lastServiceAt: dto.lastServiceAt ? new Date(dto.lastServiceAt) : dto.lastServiceAt,
        nextServiceAt: dto.nextServiceAt ? new Date(dto.nextServiceAt) : dto.nextServiceAt,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!asset) throw new NotFoundException('Asset not found');
    return asset.toObject();
  }

  async remove(organizationId: string, id: string): Promise<any> {
    const asset = await this.assetModel.findOneAndDelete({ _id: id, organizationId });
    if (!asset) throw new NotFoundException('Asset not found');
    return { deleted: true };
  }
}
