import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor, VendorDocument } from './entities/vendor.entity';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateVendorDto) {
    const vendor = await this.vendorModel.create({
      ...dto,
      organizationId,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    return vendor.toObject();
  }

  async findAll(organizationId: string, query: QueryVendorDto) {
    const { page = 1, limit = 20, search, category, isActive } = query;
    const filter: Record<string, unknown> = { organizationId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.vendorModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.vendorModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, id: string) {
    const vendor = await this.vendorModel.findOne({ _id: id, organizationId }).lean();
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateVendorDto) {
    const vendor = await this.vendorModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor.toObject();
  }

  async remove(organizationId: string, id: string) {
    const vendor = await this.vendorModel.findOneAndDelete({ _id: id, organizationId });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return { deleted: true };
  }
}
