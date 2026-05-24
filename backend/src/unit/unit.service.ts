import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUnitDto } from './dto/create-unit.dto';
import { QueryUnitDto } from './dto/query-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit, UnitDocument } from './entities/unit.entity';

@Injectable()
export class UnitService {
  constructor(
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
  ) {}

  async create(organizationId: string, dto: CreateUnitDto): Promise<any> {
    return this.unitModel.create({ ...dto, organizationId });
  }

  async findAll(organizationId: string, query: QueryUnitDto): Promise<any> {
    const { page = 1, limit = 20, search, propertyId, status, floor } = query;

    const filter: any = { organizationId };

    if (propertyId) {
      filter.propertyId = propertyId;
    }

    if (status) {
      filter.status = status;
    }

    if (floor !== undefined && floor !== null) {
      filter.floor = floor;
    }

    if (search) {
      filter.unitNumber = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.unitModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.unitModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(organizationId: string, id: string): Promise<any> {
    const unit = await this.unitModel
      .findOne({ _id: id, organizationId })
      .lean();

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateUnitDto,
  ): Promise<any> {
    const unit = await this.unitModel.findOneAndUpdate(
      { _id: id, organizationId },
      dto,
      { new: true },
    );

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const unit = await this.unitModel.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return { deleted: true };
  }
}
