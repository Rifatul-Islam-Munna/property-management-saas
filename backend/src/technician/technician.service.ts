import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { QueryTechnicianDto } from './dto/query-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { Technician, TechnicianDocument } from './entities/technician.entity';

@Injectable()
export class TechnicianService {
  constructor(
    @InjectModel(Technician.name)
    private readonly technicianModel: Model<TechnicianDocument>,
  ) {}

  async create(organizationId: string, ownerUserId: string, dto: CreateTechnicianDto): Promise<any> {
    const existing = await this.findExistingGlobalTech(dto);

    if (existing) {
      this.linkTechnicianToOwner(existing, organizationId, ownerUserId, dto.assignedProperties ?? []);
      await existing.save();
      return existing.toObject();
    }

    const technician = await this.technicianModel.create({
      ...dto,
      organizationId,
      organizationIds: organizationId ? [organizationId] : [],
      ownerIds: [ownerUserId],
      activeOwnerId: ownerUserId,
      assignedProperties: dto.assignedProperties ?? [],
      isGlobalTechnician: true,
    });
    return technician.toObject();
  }

  async findAll(organizationId: string, query: QueryTechnicianDto): Promise<any> {
    const { page = 1, limit = 20, search, availability, skill, propertyId, isActive } = query;
    const filter: any = { $or: [{ organizationId }, { organizationIds: organizationId }] };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (availability) {
      filter.availability = availability;
    }

    if (skill) {
      filter.skills = { $in: [skill] };
    }

    if (propertyId) {
      filter.assignedProperties = { $in: [propertyId] };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.technicianModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.technicianModel.countDocuments(filter),
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
    const technician = await this.technicianModel
      .findOne({ _id: id, $or: [{ organizationId }, { organizationIds: organizationId }] })
      .lean();

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    return technician;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateTechnicianDto,
  ): Promise<any> {
    const technician = await this.technicianModel
      .findOneAndUpdate({ _id: id, $or: [{ organizationId }, { organizationIds: organizationId }] }, dto, { new: true })
      .lean();

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    return technician;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const technician = await this.technicianModel.findOneAndDelete({
      _id: id,
      $or: [{ organizationId }, { organizationIds: organizationId }],
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    return { deleted: true };
  }

  private async findExistingGlobalTech(dto: CreateTechnicianDto) {
    if (dto.userId) {
      return this.technicianModel.findOne({ userId: dto.userId });
    }

    const normalizedEmail = dto.email?.trim().toLowerCase() ?? null;

    return this.technicianModel.findOne({
      $or: [{ email: normalizedEmail }, { phone: dto.phone ?? null }],
    });
  }

  private linkTechnicianToOwner(
    technician: TechnicianDocument,
    organizationId: string,
    ownerUserId: string,
    assignedProperties: string[],
  ) {
    if (organizationId && !technician.organizationIds.includes(organizationId)) {
      technician.organizationIds.push(organizationId);
    }
    if (!technician.organizationId) {
      technician.organizationId = organizationId;
    }
    if (!technician.ownerIds.includes(ownerUserId)) {
      technician.ownerIds.push(ownerUserId);
    }
    technician.activeOwnerId = ownerUserId;
    for (const propertyId of assignedProperties) {
      if (!technician.assignedProperties.includes(propertyId)) {
        technician.assignedProperties.push(propertyId);
      }
    }
    technician.isGlobalTechnician = true;
  }
}
