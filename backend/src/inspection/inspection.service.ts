import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { QueryInspectionDto } from './dto/query-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { Inspection, InspectionDocument } from './entities/inspection.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectModel(Inspection.name)
    private readonly inspectionModel: Model<InspectionDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateInspectionDto): Promise<any> {
    const inspection = await this.inspectionModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
    });
    return inspection.toObject();
  }

  async findAll(organizationId: string, query: QueryInspectionDto): Promise<any> {
    const { page = 1, limit = 20, propertyId, type, completed } = query;
    const filter: Record<string, unknown> = { organizationId };
    if (propertyId) filter.propertyId = propertyId;
    if (type) filter.type = type;
    if (completed !== undefined) filter.completed = completed;

    const [data, total] = await Promise.all([
      this.inspectionModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ scheduledAt: -1 })
        .lean(),
      this.inspectionModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, id: string): Promise<any> {
    const inspection = await this.inspectionModel.findOne({ _id: id, organizationId }).lean();
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  async update(organizationId: string, id: string, dto: UpdateInspectionDto): Promise<any> {
    const inspection = await this.inspectionModel.findOneAndUpdate(
      { _id: id, organizationId },
      dto,
      { new: true },
    );
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection.toObject();
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const inspection = await this.inspectionModel.findOneAndDelete({ _id: id, organizationId });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return { deleted: true };
  }
}
