import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FinanceEntry, FinanceEntryDocument, FinanceEntryKind, FinanceEntryStatus } from 'src/finance-entry/entities/finance-entry.entity';
import type { JwtUser } from 'src/lib/auth.guard';
import { MailDeliveryService } from 'src/notification/mail-delivery.service';
import { SmsDeliveryService } from 'src/notification/sms-delivery.service';
import { Organization, OrganizationDocument } from 'src/organization/entities/organization.entity';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { CreateStaffDto, PayStaffDto, SendStaffMessageDto } from './dto/create-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff, StaffDocument } from './entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private readonly staffModel: Model<StaffDocument>,
    @InjectModel(FinanceEntry.name) private readonly financeEntryModel: Model<FinanceEntryDocument>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    private readonly mailDeliveryService: MailDeliveryService,
    private readonly smsDeliveryService: SmsDeliveryService,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateStaffDto) {
    await this.assertProperty(organizationId, dto.propertyId);
    const staff = await this.staffModel.create({
      ...this.normalizeDto(dto),
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
      paymentRecords: [],
      messages: [],
    });
    return staff.toObject();
  }

  async findAll(organizationId: string, query: QueryStaffDto) {
    const { page = 1, limit = 20, search, propertyId, role, status, isActive } = query;
    const filter: Record<string, any> = { organizationId };
    if (search?.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { role: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (propertyId) filter.propertyId = propertyId;
    if (role?.trim()) filter.role = role.trim();
    if (status) filter.status = status;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.staffModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).lean(),
      this.staffModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, id: string) {
    const staff = await this.staffModel.findOne({ _id: id, organizationId }).lean();
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateStaffDto) {
    if (dto.propertyId) await this.assertProperty(organizationId, dto.propertyId);
    const staff = await this.staffModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...this.normalizeDto(dto),
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!staff) throw new NotFoundException('Staff not found');
    return staff.toObject();
  }

  async remove(organizationId: string, id: string) {
    const staff = await this.staffModel.findOneAndDelete({ _id: id, organizationId });
    if (!staff) throw new NotFoundException('Staff not found');
    return { deleted: true };
  }

  async pay(organizationId: string, actor: JwtUser, id: string, dto: PayStaffDto) {
    const staff = await this.staffModel.findOne({ _id: id, organizationId });
    if (!staff) throw new NotFoundException('Staff not found');

    const amount = dto.amount ?? staff.monthlyPay ?? 0;
    if (!amount) throw new BadRequestException('Payment amount required');
    const currency = (dto.currency ?? staff.currency ?? await this.defaultCurrency(organizationId)).toUpperCase();

    const financeEntry = await this.financeEntryModel.create({
      organizationId,
      kind: FinanceEntryKind.EXPENSE,
      title: `Staff salary - ${staff.fullName} - ${dto.monthKey}`,
      description: staff.workDescription ?? null,
      category: 'staff_salary',
      amount,
      currency,
      propertyId: staff.propertyId,
      source: 'staff_payment',
      status: FinanceEntryStatus.CLEARED,
      occurredAt: new Date(),
      attachments: [],
      note: dto.note ?? `Staff payment for ${dto.monthKey}`,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });

    const existing = staff.paymentRecords.find((item) => item.monthKey === dto.monthKey);
    if (existing) {
      existing.amount = amount;
      existing.currency = currency;
      existing.status = 'paid';
      existing.paidAt = new Date();
      existing.financeEntryId = String(financeEntry._id);
      existing.note = dto.note ?? existing.note ?? null;
    } else {
      staff.paymentRecords.push({
        monthKey: dto.monthKey,
        amount,
        currency,
        status: 'paid',
        paidAt: new Date(),
        financeEntryId: String(financeEntry._id),
        note: dto.note ?? null,
      });
    }

    staff.updatedByUserId = actor.id;
    staff.updatedByName = actor.fullName;
    staff.updatedByRole = actor.role;
    await staff.save();
    return staff.toObject();
  }

  async sendMessage(organizationId: string, actor: JwtUser, id: string, dto: SendStaffMessageDto) {
    const staff = await this.staffModel.findOne({ _id: id, organizationId });
    if (!staff) throw new NotFoundException('Staff not found');

    const channels: Array<'email' | 'sms'> = dto.channels?.length
      ? dto.channels
      : ['email'];
    if (channels.includes('email') && staff.email) {
      this.mailDeliveryService.sendFireAndForget({ to: staff.email, subject: dto.subject ?? 'Message from property owner', body: dto.body });
    }
    if (channels.includes('sms') && staff.phone) {
      this.smsDeliveryService.sendFireAndForget({ to: staff.phone, body: dto.body });
    }

    staff.messages.push({
      subject: dto.subject ?? null,
      body: dto.body,
      channels,
      sentAt: new Date(),
      sentBy: actor.id,
    });
    staff.updatedByUserId = actor.id;
    staff.updatedByName = actor.fullName;
    staff.updatedByRole = actor.role;
    await staff.save();
    return staff.toObject();
  }

  private normalizeDto(dto: Partial<CreateStaffDto>) {
    return {
      ...dto,
      email: dto.email?.trim()?.toLowerCase(),
      role: dto.role?.trim()?.toLowerCase(),
      currency: dto.currency?.trim()?.toUpperCase(),
      workStart: dto.workStart ? new Date(dto.workStart) : undefined,
      workEnd: dto.workEnd ? new Date(dto.workEnd) : undefined,
    };
  }

  private async assertProperty(organizationId: string, propertyId: string) {
    const property = await this.propertyModel.exists({ _id: propertyId, organizationId });
    if (!property) throw new NotFoundException('Property not found');
  }

  private async defaultCurrency(organizationId: string) {
    const organization = await this.organizationModel.findById(organizationId).lean();
    return String(organization?.settings?.stripe?.defaultCurrency ?? 'USD');
  }
}
