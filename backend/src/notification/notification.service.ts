import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { Bill, BillDocument, BillStatus } from 'src/bill/entities/bill.entity';
import { Organization, OrganizationDocument } from 'src/organization/entities/organization.entity';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Tenant, TenantDocument } from 'src/tenant/entities/tenant.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { User, UserDocument } from 'src/user/entities/user.entity';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { NotificationDeliveryLog, NotificationDeliveryLogDocument } from './entities/notification-delivery-log.entity';
import { NotificationTemplate, NotificationTemplateDocument } from './entities/notification-template.entity';
import { MailDeliveryService } from './mail-delivery.service';
import { SmsDeliveryService } from './sms-delivery.service';

type Channel = 'email' | 'sms';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationTemplate.name)
    private readonly templateModel: Model<NotificationTemplateDocument>,
    @InjectModel(NotificationDeliveryLog.name)
    private readonly logModel: Model<NotificationDeliveryLogDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Bill.name)
    private readonly billModel: Model<BillDocument>,
    private readonly mailDeliveryService: MailDeliveryService,
    private readonly smsDeliveryService: SmsDeliveryService,
  ) {}

  async getSettings(organizationId: string): Promise<any> {
    const organization = await this.organizationModel.findById(organizationId).lean();
    if (!organization) throw new NotFoundException('Organization not found');
    return this.normalizeSettings(organization.settings?.notifications ?? {});
  }

  async saveSettings(organizationId: string, dto: NotificationSettingsDto): Promise<any> {
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) throw new NotFoundException('Organization not found');
    const current = this.normalizeSettings(organization.settings?.notifications ?? {});
    organization.settings = {
      ...(organization.settings ?? {}),
      notifications: {
        ...current,
        ...dto,
        overdueRentChannels: dto.overdueRentChannels ?? current.overdueRentChannels,
        inspectionChannels: dto.inspectionChannels ?? current.inspectionChannels,
        recurringMaintenanceChannels: dto.recurringMaintenanceChannels ?? current.recurringMaintenanceChannels,
      },
    };
    await organization.save();
    return this.getSettings(organizationId);
  }

  async createTemplate(organizationId: string, actor: JwtUser, dto: CreateNotificationTemplateDto): Promise<any> {
    const template = await this.templateModel.create({
      ...dto,
      organizationId,
      channels: dto.channels?.length ? dto.channels : ['email'],
      isActive: dto.isActive ?? true,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    return template.toObject();
  }

  async findTemplates(organizationId: string): Promise<any> {
    const data = await this.templateModel.find({ organizationId }).sort({ createdAt: -1 }).lean();
    return { data, total: data.length, page: 1, limit: data.length || 20, totalPages: data.length ? 1 : 0 };
  }

  async updateTemplate(organizationId: string, actor: JwtUser, id: string, dto: UpdateNotificationTemplateDto): Promise<any> {
    const template = await this.templateModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!template) throw new NotFoundException('Notification template not found');
    return template.toObject();
  }

  async sendTemplate(organizationId: string, actor: JwtUser, dto: SendTemplateDto): Promise<any> {
    const template = await this.templateModel.findOne({ _id: dto.templateId, organizationId, isActive: true }).lean();
    if (!template) throw new NotFoundException('Notification template not found');
    const tenants = await this.tenantModel.find({ _id: { $in: dto.tenantIds }, organizationId }).lean();
    const channels = dto.channels?.length ? dto.channels : template.channels;
    let queued = 0;

    for (const tenant of tenants) {
      const variables = await this.buildVariables(organizationId, tenant);
      const subject = this.render(template.subject ?? template.name, variables);
      const body = this.render(template.body, variables);
      this.dispatch(tenant, channels as Channel[], subject, body);
      queued += channels.length;
    }

    void actor;
    return { tenants: tenants.length, queued };
  }

  async runOverdueRentNotices(): Promise<any> {
    const organizations = await this.organizationModel.find({ isActive: true }).lean();
    let queued = 0;

    for (const organization of organizations) {
      const settings = this.normalizeSettings(organization.settings?.notifications ?? {});
      if (!settings.overdueRentEnabled) continue;

      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - settings.overdueRentDaysAfterDue);
      const bills = await this.billModel.find({
        organizationId: String(organization._id),
        status: { $in: [BillStatus.UNPAID, BillStatus.PARTIAL, BillStatus.OVERDUE] },
        dueDate: { $lte: cutoff },
      }).lean();

      const template = settings.overdueRentTemplateId
        ? await this.templateModel.findOne({ _id: settings.overdueRentTemplateId, organizationId: String(organization._id), isActive: true }).lean()
        : null;

      for (const bill of bills) {
        const tenant = await this.tenantModel.findOne({ _id: bill.tenantId, organizationId: bill.organizationId }).lean();
        if (!tenant) continue;
        const triggerDay = this.repeatBucket(settings.overdueRentRepeatEveryDays);
        const triggerKey = `overdue-rent:${bill._id}:${triggerDay}`;
        const variables = await this.buildVariables(String(organization._id), tenant, bill);
        const subject = this.render(template?.subject ?? 'Rent payment overdue', variables);
        const body = this.render(
          template?.body ?? 'Hi {{tenant_full_name}}, rent bill {{bill_title}} for {{bill_amount}} is overdue. Please pay as soon as possible.',
          variables,
        );

        for (const channel of settings.overdueRentChannels) {
          const exists = await this.logModel.exists({
            organizationId: String(organization._id),
            triggerKey,
            recipientId: String(tenant._id),
            channel,
          });
          if (exists) continue;
          await this.logModel.create({
            organizationId: String(organization._id),
            triggerKey,
            recipientId: String(tenant._id),
            channel,
            status: 'queued',
          });
          this.dispatch(tenant, [channel], subject, body);
          queued += 1;
        }
      }
    }

    return { queued };
  }

  async notifyInspectionAssigned(organizationId: string, inspection: any): Promise<void> {
    const settings = await this.getSettings(organizationId);
    if (!settings.inspectionEnabled || !inspection.assignedTo) return;
    const recipient = await this.userModel.findById(inspection.assignedTo).lean();
    if (!recipient) return;
    const template = settings.inspectionTemplateId
      ? await this.templateModel.findOne({ _id: settings.inspectionTemplateId, organizationId, isActive: true }).lean()
      : null;
    const variables = await this.buildWorkVariables(organizationId, recipient, inspection, 'inspection');
    const subject = this.render(template?.subject ?? 'Inspection assigned', variables);
    const body = this.render(
      template?.body ?? 'Hi {{worker_full_name}}, inspection {{work_title}} is assigned at {{property_name}} {{unit_number}} on {{scheduled_date}}.',
      variables,
    );
    this.dispatchUser(recipient, settings.inspectionChannels, subject, body);
  }

  async notifyRecurringMaintenanceAssigned(organizationId: string, item: any): Promise<void> {
    const settings = await this.getSettings(organizationId);
    if (!settings.recurringMaintenanceEnabled || !item.assignedTo) return;
    const recipient = await this.userModel.findById(item.assignedTo).lean();
    if (!recipient) return;
    const template = settings.recurringMaintenanceTemplateId
      ? await this.templateModel.findOne({ _id: settings.recurringMaintenanceTemplateId, organizationId, isActive: true }).lean()
      : null;
    const variables = await this.buildWorkVariables(organizationId, recipient, item, 'recurring');
    const subject = this.render(template?.subject ?? 'Recurring maintenance assigned', variables);
    const body = this.render(
      template?.body ?? 'Hi {{worker_full_name}}, recurring maintenance {{work_title}} is assigned at {{property_name}} {{unit_number}}. Next run {{scheduled_date}}.',
      variables,
    );
    this.dispatchUser(recipient, settings.recurringMaintenanceChannels, subject, body);
  }

  private dispatch(tenant: any, channels: Channel[], subject: string, body: string) {
    for (const channel of channels) {
      if (channel === 'email' && tenant.email) {
        this.mailDeliveryService.sendFireAndForget({ to: tenant.email, subject, body });
      }
      if (channel === 'sms' && tenant.phone) {
        this.smsDeliveryService.sendFireAndForget({ to: tenant.phone, body });
      }
    }
  }

  private dispatchUser(user: any, channels: Channel[], subject: string, body: string) {
    for (const channel of channels) {
      if (channel === 'email' && user.email) {
        this.mailDeliveryService.sendFireAndForget({ to: user.email, subject, body });
      }
      if (channel === 'sms' && user.phoneNumber) {
        this.smsDeliveryService.sendFireAndForget({ to: user.phoneNumber, body });
      }
    }
  }

  private async buildWorkVariables(organizationId: string, user: any, item: any, kind: 'inspection' | 'recurring') {
    const [property, unit] = await Promise.all([
      item.propertyId ? this.propertyModel.findOne({ _id: item.propertyId, organizationId }).lean() : null,
      item.unitId ? this.unitModel.findOne({ _id: item.unitId, organizationId }).lean() : null,
    ]);
    return {
      worker_full_name: user.fullName ?? '',
      worker_email: user.email ?? '',
      worker_phone: user.phoneNumber ?? '',
      property_name: property?.name ?? '',
      unit_number: unit?.unitNumber ?? '',
      work_type: kind,
      work_title: item.title ?? item.type ?? kind,
      scheduled_date: (item.scheduledAt ?? item.nextRunAt) ? new Date(item.scheduledAt ?? item.nextRunAt).toISOString().slice(0, 10) : '',
      current_date: new Date().toISOString().slice(0, 10),
    };
  }

  private async buildVariables(organizationId: string, tenant: any, bill?: any) {
    const [property, unit, user] = await Promise.all([
      tenant.propertyId ? this.propertyModel.findOne({ _id: tenant.propertyId, organizationId }).lean() : null,
      tenant.unitId ? this.unitModel.findOne({ _id: tenant.unitId, organizationId }).lean() : null,
      tenant.userId ? this.userModel.findById(tenant.userId).lean() : null,
    ]);
    return {
      tenant_full_name: tenant.fullName ?? user?.fullName ?? '',
      tenant_email: tenant.email ?? user?.email ?? '',
      tenant_phone: tenant.phone ?? user?.phoneNumber ?? '',
      tenant_monthly_rent: tenant.monthlyRent != null ? String(tenant.monthlyRent) : '',
      property_name: property?.name ?? '',
      unit_number: unit?.unitNumber ?? '',
      bill_title: bill?.title ?? '',
      bill_amount: bill?.amount != null ? String(bill.amount) : '',
      bill_due_date: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : '',
      current_date: new Date().toISOString().slice(0, 10),
    };
  }

  private render(value: string, variables: Record<string, string>) {
    return value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => variables[key] ?? '');
  }

  private repeatBucket(days: number) {
    const now = new Date();
    const epochDay = Math.floor(now.getTime() / 86400000);
    return Math.floor(epochDay / Math.max(1, days));
  }

  private normalizeSettings(value: any) {
    return {
      overdueRentEnabled: Boolean(value.overdueRentEnabled),
      overdueRentDaysAfterDue: Number(value.overdueRentDaysAfterDue ?? 1),
      overdueRentRepeatEveryDays: Number(value.overdueRentRepeatEveryDays ?? 3),
      overdueRentChannels: Array.isArray(value.overdueRentChannels) && value.overdueRentChannels.length
        ? value.overdueRentChannels
        : ['email'],
      overdueRentTemplateId: value.overdueRentTemplateId ?? '',
      inspectionEnabled: Boolean(value.inspectionEnabled),
      inspectionChannels: Array.isArray(value.inspectionChannels) && value.inspectionChannels.length
        ? value.inspectionChannels
        : ['email'],
      inspectionTemplateId: value.inspectionTemplateId ?? '',
      recurringMaintenanceEnabled: Boolean(value.recurringMaintenanceEnabled),
      recurringMaintenanceChannels: Array.isArray(value.recurringMaintenanceChannels) && value.recurringMaintenanceChannels.length
        ? value.recurringMaintenanceChannels
        : ['email'],
      recurringMaintenanceTemplateId: value.recurringMaintenanceTemplateId ?? '',
      tenantCreatedChannels: value.tenantCreatedChannels ?? [],
      tenantCreatedTemplateId: value.tenantCreatedTemplateId ?? '',
      workerCreatedChannels: value.workerCreatedChannels ?? [],
      workerCreatedTemplateId: value.workerCreatedTemplateId ?? '',
      noticeCreatedChannels: value.noticeCreatedChannels ?? [],
      noticeCreatedTemplateId: value.noticeCreatedTemplateId ?? '',
    };
  }
}
