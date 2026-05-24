import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreateRecurringMaintenanceDto } from './dto/create-recurring-maintenance.dto';
import { QueryRecurringMaintenanceDto } from './dto/query-recurring-maintenance.dto';
import { UpdateRecurringMaintenanceDto } from './dto/update-recurring-maintenance.dto';
import { RecurringMaintenance, RecurringMaintenanceDocument } from './entities/recurring-maintenance.entity';

@Injectable()
export class RecurringMaintenanceService {
  constructor(
    @InjectModel(RecurringMaintenance.name)
    private readonly recurringModel: Model<RecurringMaintenanceDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateRecurringMaintenanceDto): Promise<any> {
    const item = await this.recurringModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
    });
    return item.toObject();
  }

  async findAll(organizationId: string, query: QueryRecurringMaintenanceDto): Promise<any> {
    const { page = 1, limit = 20, propertyId, frequency, isActive } = query;
    const filter: Record<string, unknown> = { organizationId };
    if (propertyId) filter.propertyId = propertyId;
    if (frequency) filter.frequency = frequency;
    if (isActive !== undefined) filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.recurringModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ nextRunAt: 1 })
        .lean(),
      this.recurringModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, id: string): Promise<any> {
    const item = await this.recurringModel.findOne({ _id: id, organizationId }).lean();
    if (!item) throw new NotFoundException('Recurring maintenance not found');
    return item;
  }

  async update(organizationId: string, id: string, dto: UpdateRecurringMaintenanceDto): Promise<any> {
    const item = await this.recurringModel.findOneAndUpdate({ _id: id, organizationId }, dto, { new: true });
    if (!item) throw new NotFoundException('Recurring maintenance not found');
    return item.toObject();
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const item = await this.recurringModel.findOneAndDelete({ _id: id, organizationId });
    if (!item) throw new NotFoundException('Recurring maintenance not found');
    return { deleted: true };
  }
}
