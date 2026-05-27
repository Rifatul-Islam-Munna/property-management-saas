import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { CreateRecurringMaintenanceDto } from './dto/create-recurring-maintenance.dto';
import { QueryRecurringMaintenanceDto } from './dto/query-recurring-maintenance.dto';
import { ReportRecurringMaintenanceDto } from './dto/report-recurring-maintenance.dto';
import { UpdateRecurringMaintenanceDto } from './dto/update-recurring-maintenance.dto';
import {
  RecurringMaintenance,
  RecurringMaintenanceDocument,
  RecurringReportStatus,
} from './entities/recurring-maintenance.entity';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class RecurringMaintenanceService {
  constructor(
    @InjectModel(RecurringMaintenance.name)
    private readonly recurringModel: Model<RecurringMaintenanceDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateRecurringMaintenanceDto): Promise<any> {
    const item = await this.recurringModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      runHistory: [],
    });
    return this.enrichRecurring(item.toObject());
  }

  async findAll(organizationId: string, actor: JwtUser, query: QueryRecurringMaintenanceDto): Promise<any> {
    const { page = 1, limit = 20, propertyId, frequency, isActive, assignedTo } = query;
    const filter: Record<string, unknown> =
      actor.role === UserRole.WORKER ? { assignedTo: actor.id } : { organizationId };
    if (propertyId) filter.propertyId = propertyId;
    if (frequency) filter.frequency = frequency;
    if (isActive !== undefined) filter.isActive = isActive;
    if (assignedTo && actor.role !== UserRole.WORKER) filter.assignedTo = assignedTo;

    const [data, total] = await Promise.all([
      this.recurringModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ nextRunAt: 1 })
        .lean(),
      this.recurringModel.countDocuments(filter),
    ]);

    return { data: await this.enrichRecurringMany(data), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, actor: JwtUser, id: string): Promise<any> {
    const filter =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };
    const item = await this.recurringModel.findOne(filter).lean();
    if (!item) throw new NotFoundException('Recurring maintenance not found');
    return this.enrichRecurring(item);
  }

  async update(organizationId: string, id: string, dto: UpdateRecurringMaintenanceDto): Promise<any> {
    const updatePayload: Record<string, unknown> = { ...dto };
    if (dto.paymentStatus !== undefined) {
      updatePayload.paidAt = dto.paymentStatus === 'paid' ? new Date() : null;
    }
    const item = await this.recurringModel.findOneAndUpdate({ _id: id, organizationId }, updatePayload, { new: true });
    if (!item) throw new NotFoundException('Recurring maintenance not found');
    return this.enrichRecurring(item.toObject());
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const item = await this.recurringModel.findOneAndDelete({ _id: id, organizationId });
    if (!item) throw new NotFoundException('Recurring maintenance not found');
    return { deleted: true };
  }

  async submitReport(
    organizationId: string,
    actor: JwtUser,
    id: string,
    dto: ReportRecurringMaintenanceDto,
  ): Promise<any> {
    const filter =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };
    const item = await this.recurringModel.findOne(filter);
    if (!item) throw new NotFoundException('Recurring maintenance not found');

    item.runHistory.push({
      status: dto.status ?? RecurringReportStatus.COMPLETED,
      note: dto.note ?? null,
      files: dto.files ?? [],
      reportedAt: new Date(),
      reportedBy: actor.id,
    } as never);
    if (dto.actualCost !== undefined) {
      item.actualCost = dto.actualCost;
    }
    if (dto.currency !== undefined) {
      item.currency = dto.currency;
    }
    if (dto.paymentStatus !== undefined) {
      item.paymentStatus = dto.paymentStatus as 'unpaid' | 'paid';
      item.paidAt = dto.paymentStatus === 'paid' ? new Date() : null;
    }

    await item.save();
    return this.enrichRecurring(item.toObject());
  }

  private async enrichRecurringMany<T extends { propertyId?: string; unitId?: string | null }>(items: T[]) {
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

  private async enrichRecurring<T extends { propertyId?: string; unitId?: string | null }>(item: T) {
    const [enriched] = await this.enrichRecurringMany([item]);
    return enriched;
  }
}
