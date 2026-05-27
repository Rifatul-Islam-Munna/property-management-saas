import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { QueryInspectionDto } from './dto/query-inspection.dto';
import { ReportInspectionDto } from './dto/report-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { Inspection, InspectionDocument } from './entities/inspection.entity';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectModel(Inspection.name)
    private readonly inspectionModel: Model<InspectionDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateInspectionDto): Promise<any> {
    const inspection = await this.inspectionModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    return this.enrichInspection(inspection.toObject());
  }

  async findAll(organizationId: string, actor: JwtUser, query: QueryInspectionDto): Promise<any> {
    const { page = 1, limit = 20, propertyId, type, completed, assignedTo } = query;
    const filter: Record<string, unknown> =
      actor.role === UserRole.WORKER ? { assignedTo: actor.id } : { organizationId };
    if (propertyId) filter.propertyId = propertyId;
    if (type) filter.type = type;
    if (completed !== undefined) filter.completed = completed;
    if (assignedTo && actor.role !== UserRole.WORKER) filter.assignedTo = assignedTo;

    const [data, total] = await Promise.all([
      this.inspectionModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ scheduledAt: -1 })
        .lean(),
      this.inspectionModel.countDocuments(filter),
    ]);

    return { data: await this.enrichInspections(data), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, actor: JwtUser, id: string): Promise<any> {
    const filter =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };
    const inspection = await this.inspectionModel.findOne(filter).lean();
    if (!inspection) throw new NotFoundException('Inspection not found');
    return this.enrichInspection(inspection);
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateInspectionDto): Promise<any> {
    const updatePayload: Record<string, unknown> = { ...dto };
    if (dto.completed) {
      updatePayload.completedAt = new Date();
    }
    if (dto.paymentStatus !== undefined) {
      updatePayload.paidAt = dto.paymentStatus === 'paid' ? new Date() : null;
    }
    const inspection = await this.inspectionModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...updatePayload,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!inspection) throw new NotFoundException('Inspection not found');
    return this.enrichInspection(inspection.toObject());
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const inspection = await this.inspectionModel.findOneAndDelete({ _id: id, organizationId });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return { deleted: true };
  }

  async submitReport(
    organizationId: string,
    actor: JwtUser,
    id: string,
    dto: ReportInspectionDto,
  ): Promise<any> {
    const filter =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };
    const inspection = await this.inspectionModel.findOne(filter);
    if (!inspection) throw new NotFoundException('Inspection not found');

    inspection.workerReport = dto.workerReport ?? inspection.workerReport ?? null;
    inspection.workerReportFiles = dto.workerReportFiles ?? inspection.workerReportFiles ?? [];
    inspection.damageReport = dto.damageReport ?? inspection.damageReport ?? null;
    inspection.notes = dto.notes ?? inspection.notes ?? null;
    if (dto.actualCost !== undefined) {
      inspection.actualCost = dto.actualCost;
    }
    if (dto.currency !== undefined) {
      inspection.currency = dto.currency;
    }
    if (dto.paymentStatus !== undefined) {
      inspection.paymentStatus = dto.paymentStatus as 'unpaid' | 'paid';
      inspection.paidAt = dto.paymentStatus === 'paid' ? new Date() : null;
    }
    inspection.workerReportedAt = new Date();
    inspection.workerReportedBy = actor.id;
    inspection.updatedByUserId = actor.id;
    inspection.updatedByName = actor.fullName;
    inspection.updatedByRole = actor.role;

    if (dto.completed !== undefined) {
      inspection.completed = dto.completed;
      inspection.completedAt = dto.completed ? new Date() : null;
    }

    await inspection.save();
    return this.enrichInspection(inspection.toObject());
  }

  private async enrichInspections<T extends { propertyId?: string; unitId?: string | null }>(items: T[]) {
    if (!items.length) return items;

    const propertyIds = [...new Set(items.map((item) => item.propertyId).filter(Boolean))] as string[];
    const unitIds = [...new Set(items.map((item) => item.unitId).filter(Boolean))] as string[];
    const [properties, units] = await Promise.all([
      propertyIds.length ? this.propertyModel.find({ _id: { $in: propertyIds } }).select({ _id: 1, name: 1 }).lean() : [],
      unitIds.length ? this.unitModel.find({ _id: { $in: unitIds } }).select({ _id: 1, unitNumber: 1 }).lean() : [],
    ]);

    const propertyMap = new Map<string, string | null>(properties.map((property) => [String(property._id), property.name] as const));
    const unitMap = new Map<string, string | null>(units.map((unit) => [String(unit._id), unit.unitNumber] as const));

    return items.map((item) => ({
      ...item,
      propertyName: item.propertyId ? propertyMap.get(item.propertyId) ?? null : null,
      unitNumber: item.unitId ? unitMap.get(item.unitId) ?? null : null,
    }));
  }

  private async enrichInspection<T extends { propertyId?: string; unitId?: string | null }>(item: T) {
    const [enriched] = await this.enrichInspections([item]);
    return enriched;
  }
}
