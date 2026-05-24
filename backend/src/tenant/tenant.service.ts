import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { RecordTenantPaymentDto } from './dto/record-tenant-payment.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  Tenant,
  TenantDocument,
  TenantKind,
  TenantPaymentStatus,
} from './entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async create(organizationId: string, dto: CreateTenantDto): Promise<any> {
    return this.tenantModel.create({
      ...dto,
      organizationId,
      tenantKind: dto.tenantKind ?? TenantKind.RENTER,
      paymentRecords: [],
    });
  }

  async findAll(organizationId: string, query: QueryTenantDto): Promise<any> {
    const {
      page = 1,
      limit = 20,
      search,
      propertyId,
      unitId,
      tenantKind,
      paymentMonth,
      paidThisMonth,
      isActive,
    } = query;

    const filter: any = { organizationId };

    if (propertyId) filter.propertyId = propertyId;
    if (unitId) filter.unitId = unitId;
    if (tenantKind) filter.tenantKind = tenantKind;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
    }

    const [data, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.tenantModel.countDocuments(filter),
    ]);

    let filteredData = data;
    if (paymentMonth && typeof paidThisMonth === 'boolean') {
      filteredData = data.filter((tenant: any) => {
        const payment = tenant.paymentRecords?.find((item: any) => item.monthKey === paymentMonth);
        const isPaid =
          payment?.status === TenantPaymentStatus.PAID ||
          (tenant.tenantKind === TenantKind.GUEST && tenant.guestFeePaid);
        return paidThisMonth ? isPaid : !isPaid;
      });
    }

    return {
      data: filteredData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(organizationId: string, id: string): Promise<any> {
    const tenant = await this.tenantModel
      .findOne({ _id: id, organizationId })
      .lean();

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateTenantDto,
  ): Promise<any> {
    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, organizationId },
      dto,
      { new: true },
    );

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const tenant = await this.tenantModel.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return { deleted: true };
  }

  async recordPayment(
    organizationId: string,
    id: string,
    dto: RecordTenantPaymentDto,
  ): Promise<any> {
    const tenant = await this.tenantModel.findOne({ _id: id, organizationId });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const existing = tenant.paymentRecords.find((item) => item.monthKey === dto.monthKey);

    if (existing) {
      existing.amount = dto.amount;
      existing.status = dto.status ?? TenantPaymentStatus.PAID;
      existing.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      existing.dueDate = dto.dueDate ? new Date(dto.dueDate) : existing.dueDate;
      existing.paymentMethod = dto.paymentMethod ?? existing.paymentMethod;
      existing.note = dto.note ?? existing.note;
    } else {
      tenant.paymentRecords.push({
        monthKey: dto.monthKey,
        amount: dto.amount,
        status: dto.status ?? TenantPaymentStatus.PAID,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paymentMethod: dto.paymentMethod ?? null,
        note: dto.note ?? null,
      } as any);
    }

    if (tenant.tenantKind === TenantKind.GUEST) {
      tenant.guestFeePaid = true;
    }

    await tenant.save();
    return tenant.toObject();
  }
}
