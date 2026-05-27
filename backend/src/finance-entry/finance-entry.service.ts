import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { Organization, OrganizationDocument } from 'src/organization/entities/organization.entity';
import { CreateFinanceEntryDto } from './dto/create-finance-entry.dto';
import { QueryFinanceEntryDto } from './dto/query-finance-entry.dto';
import { UpdateFinanceEntryDto } from './dto/update-finance-entry.dto';
import { FinanceEntry, FinanceEntryDocument, FinanceEntryStatus } from './entities/finance-entry.entity';

@Injectable()
export class FinanceEntryService {
  constructor(
    @InjectModel(FinanceEntry.name)
    private readonly financeEntryModel: Model<FinanceEntryDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateFinanceEntryDto): Promise<any> {
    const organization = await this.organizationModel.findById(organizationId).lean();
    const defaultCurrency = String(organization?.settings?.stripe?.defaultCurrency ?? 'USD').toUpperCase();
    const entry = await this.financeEntryModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
      category: dto.category.trim().toLowerCase(),
      currency: dto.currency?.trim()?.toUpperCase() ?? defaultCurrency,
      occurredAt: new Date(dto.occurredAt),
      status: dto.status ?? FinanceEntryStatus.CLEARED,
      source: dto.source?.trim() ?? 'manual',
      attachments: dto.attachments ?? [],
    });

    return entry.toObject();
  }

  async findAll(organizationId: string, query: QueryFinanceEntryDto): Promise<any> {
    const { page = 1, limit = 20, search, kind, status, propertyId, category, from, to, includeCanceled } = query;
    const filter: Record<string, any> = { organizationId };

    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { note: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (kind) filter.kind = kind;
    if (status) filter.status = status;
    if (!status && !includeCanceled) filter.status = { $ne: FinanceEntryStatus.CANCELED };
    if (propertyId) filter.propertyId = propertyId;
    if (category?.trim()) filter.category = category.trim().toLowerCase();
    if (from || to) {
      filter.occurredAt = {};
      if (from) filter.occurredAt.$gte = new Date(from);
      if (to) filter.occurredAt.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.financeEntryModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ occurredAt: -1, createdAt: -1 }).lean(),
      this.financeEntryModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, id: string): Promise<any> {
    const entry = await this.financeEntryModel.findOne({ _id: id, organizationId }).lean();
    if (!entry) throw new NotFoundException('Finance entry not found');
    return entry;
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateFinanceEntryDto): Promise<any> {
    const entry = await this.financeEntryModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        category: dto.category?.trim().toLowerCase(),
        currency: dto.currency?.trim()?.toUpperCase(),
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!entry) throw new NotFoundException('Finance entry not found');
    return entry.toObject();
  }

  async remove(organizationId: string, id: string): Promise<any> {
    const entry = await this.financeEntryModel.findOneAndDelete({ _id: id, organizationId });
    if (!entry) throw new NotFoundException('Finance entry not found');
    return { deleted: true };
  }
}
