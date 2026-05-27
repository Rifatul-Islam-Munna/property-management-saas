import type { JwtUser } from 'src/lib/auth.guard';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePropertyDto } from './dto/create-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property, PropertyDocument } from './entities/property.entity';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async create(
    organizationId: string,
    actor: JwtUser,
    dto: CreatePropertyDto,
  ): Promise<any> {
    const property = await this.propertyModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    return property.toObject();
  }

  async findAll(organizationId: string, query: QueryPropertyDto): Promise<any> {
    const { page = 1, limit = 20, search, type, isActive } = query;
    const filter: any = { organizationId };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (type) {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.propertyModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.propertyModel.countDocuments(filter),
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
    const property = await this.propertyModel
      .findOne({ _id: id, organizationId })
      .lean();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async update(
    organizationId: string,
    actor: JwtUser,
    id: string,
    dto: UpdatePropertyDto,
  ): Promise<any> {
    const property = await this.propertyModel
      .findOneAndUpdate(
        { _id: id, organizationId },
        {
          ...dto,
          updatedByUserId: actor.id,
          updatedByName: actor.fullName,
          updatedByRole: actor.role,
        },
        { new: true },
      )
      .lean();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const property = await this.propertyModel.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return { deleted: true };
  }
}
