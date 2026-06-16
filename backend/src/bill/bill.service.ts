import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type { JwtUser } from 'src/lib/auth.guard';
import { Organization, OrganizationDocument } from 'src/organization/entities/organization.entity';
import { Tenant, TenantDocument } from 'src/tenant/entities/tenant.entity';
import { TenantKind, TenantPaymentStatus } from 'src/tenant/entities/tenant.entity';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { GenerateMonthlyBillsDto } from './dto/generate-monthly-bills.dto';
import { QueryBillDto } from './dto/query-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { Bill, BillDocument, BillKind, BillStatus } from './entities/bill.entity';

@Injectable()
export class BillService {
  constructor(
    @InjectModel(Bill.name)
    private readonly billModel: Model<BillDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateBillDto): Promise<any> {
    const tenant = await this.tenantModel.findOne({ _id: dto.tenantId, organizationId }).lean();
    if (!tenant) throw new NotFoundException('Tenant not found');
    const defaultCurrency = await this.getOrganizationDefaultCurrency(organizationId);

    const bill = await this.billModel.create({
      ...dto,
      organizationId,
      propertyId: dto.propertyId || tenant.propertyId,
      unitId: dto.unitId ?? tenant.unitId ?? null,
      recipientUserId: tenant.userId ?? null,
      currency: dto.currency?.trim()?.toUpperCase() ?? defaultCurrency,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
      attachments: dto.attachments ?? [],
      paymentMode: 'manual',
    });

    return bill.toObject();
  }

  async findAll(organizationId: string, query: QueryBillDto): Promise<any> {
    const { page = 1, limit = 20, tenantId, propertyId, unitId, monthKey, kind, status, dueFrom, dueTo } = query;
    const filter: Record<string, unknown> = { organizationId };
    if (tenantId) filter.tenantId = tenantId;
    if (propertyId) filter.propertyId = propertyId;
    if (unitId) filter.unitId = unitId;
    if (monthKey) filter.monthKey = monthKey;
    if (kind) filter.kind = kind;
    if (status) filter.status = status;
    if (dueFrom || dueTo) {
      filter.dueDate = {};
      if (dueFrom) (filter.dueDate as Record<string, Date>).$gte = new Date(dueFrom);
      if (dueTo) (filter.dueDate as Record<string, Date>).$lte = new Date(dueTo);
    }

    const [data, total] = await Promise.all([
      this.billModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).lean(),
      this.billModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async generateMonthlyRentBills(
    organizationId: string,
    actor: JwtUser,
    dto: GenerateMonthlyBillsDto,
  ): Promise<any> {
    const defaultCurrency = await this.getOrganizationDefaultCurrency(organizationId);
    const tenantFilter: Record<string, unknown> = {
      organizationId,
      tenantKind: TenantKind.RENTER,
      isActive: true,
      monthlyRent: { $gt: 0 },
    };
    if (dto.propertyId) tenantFilter.propertyId = dto.propertyId;

    const tenants = await this.tenantModel.find(tenantFilter).lean();
    const now = new Date();
    const created: any[] = [];
    let skipped = 0;
    let markedOverdue = 0;
    let lateFeesApplied = 0;

    for (const tenant of tenants) {
      const dueDate = this.buildDueDate(dto.monthKey, tenant.rentDueDay ?? null);
      const existing = await this.billModel.findOne({
        organizationId,
        tenantId: String(tenant._id),
        kind: BillKind.RENT,
        monthKey: dto.monthKey,
      });

      if (existing) {
        skipped += 1;
        let changed = false;
        const shouldBeOverdue =
          dueDate &&
          dueDate.getTime() + (dto.graceDays ?? 0) * 86400000 < now.getTime() &&
          [BillStatus.UNPAID, BillStatus.PARTIAL].includes(existing.status);

        if (shouldBeOverdue) {
          existing.status = BillStatus.OVERDUE;
          markedOverdue += 1;
          changed = true;
        }

        if (
          dto.applyLateFees &&
          shouldBeOverdue &&
          dto.lateFeeAmount &&
          !existing.note?.includes('Late fee applied')
        ) {
          existing.amount = (existing.amount ?? 0) + dto.lateFeeAmount;
          existing.note = `${existing.note ? `${existing.note} | ` : ''}Late fee applied ${dto.lateFeeAmount}`;
          lateFeesApplied += 1;
          changed = true;
        }

        if (changed) {
          existing.updatedByUserId = actor.id;
          existing.updatedByName = actor.fullName;
          existing.updatedByRole = actor.role;
          await existing.save();
        }
        continue;
      }

      const bill = await this.billModel.create({
        organizationId,
        tenantId: String(tenant._id),
        recipientUserId: tenant.userId ?? null,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId ?? null,
        kind: BillKind.RENT,
        title: `Monthly rent ${dto.monthKey}`,
        description: 'Auto-generated monthly rent bill',
        amount: tenant.monthlyRent ?? 0,
        currency: defaultCurrency,
        monthKey: dto.monthKey,
        dueDate,
        status: BillStatus.UNPAID,
        attachments: [],
        note: 'Auto-generated monthly rent',
        createdBy: actor.id,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
        paymentMode: 'manual',
      });
      created.push(bill.toObject());
    }

    return {
      monthKey: dto.monthKey,
      tenantsScanned: tenants.length,
      created: created.length,
      skipped,
      markedOverdue,
      lateFeesApplied,
      bills: created,
    };
  }

  async findMyBills(organizationId: string, actor: JwtUser): Promise<any> {
    const tenant = await this.resolveResidentTenant(organizationId, actor);

    if (!tenant) {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const data = await this.billModel.find({ organizationId: tenant.organizationId, tenantId: String(tenant._id) }).sort({ createdAt: -1 }).lean();
    const safeData = data.map((item) => this.toResidentBill(item));
    return { data: safeData, total: safeData.length, page: 1, limit: safeData.length || 20, totalPages: safeData.length ? 1 : 0 };
  }

  async findById(organizationId: string, actor: JwtUser, id: string): Promise<any> {
    const bill =
      (organizationId
        ? await this.billModel.findOne({ _id: id, organizationId }).lean()
        : null) ??
      (await this.billModel.findById(id).lean());
    if (!bill) throw new NotFoundException('Bill not found');

    if ([UserRole.RENTER, UserRole.GUEST].includes(actor.role)) {
      const tenant = await this.tenantModel
        .findOne({
          organizationId: bill.organizationId,
          _id: bill.tenantId,
          $or: [{ userId: actor.id }, { email: actor.email }],
        })
        .lean();
      if (!tenant) throw new NotFoundException('Bill not found');
    }

    if ([UserRole.RENTER, UserRole.GUEST].includes(actor.role)) {
      return this.toResidentBill(bill);
    }

    return bill;
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateBillDto): Promise<any> {
    const bill = await this.billModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : dto.dueDate,
        paidAt: dto.status === 'paid' ? new Date() : undefined,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!bill) throw new NotFoundException('Bill not found');
    if (dto.status === 'paid') {
      await this.syncTenantPaymentFromBill(organizationId, bill.toObject());
    }
    return bill.toObject();
  }

  async remove(organizationId: string, id: string): Promise<any> {
    const bill = await this.billModel.findOneAndDelete({ _id: id, organizationId });
    if (!bill) throw new NotFoundException('Bill not found');
    return { deleted: true };
  }

  async createStripeCheckout(
    organizationId: string,
    actor: JwtUser,
    billId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<any> {
    const bill =
      (organizationId
        ? await this.billModel.findOne({ _id: billId, organizationId })
        : null) ??
      (await this.billModel.findById(billId));
    if (!bill) throw new NotFoundException('Bill not found');
    await this.assertResidentCanAccessBill(actor, bill.toObject());
    const scopedOrganizationId = String(bill.organizationId);

    const tenant = await this.tenantModel.findOne({ _id: bill.tenantId, organizationId: scopedOrganizationId }).lean();
    if (!tenant) throw new NotFoundException('Tenant not found');

    const stripeSecret = await this.getStripeSecret(scopedOrganizationId);
    const paymentToken = randomUUID();

    const payload = new URLSearchParams();
    payload.append('mode', 'payment');
    payload.append('success_url', `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&bill=${billId}&token=${paymentToken}`);
    payload.append('cancel_url', `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}bill=${billId}&token=${paymentToken}`);
    payload.append('line_items[0][price_data][currency]', String(bill.currency ?? 'usd').toLowerCase());
    payload.append('line_items[0][price_data][product_data][name]', bill.title);
    payload.append('line_items[0][price_data][product_data][description]', bill.description ?? bill.note ?? '');
    payload.append('line_items[0][price_data][unit_amount]', String(Math.round((bill.amount ?? 0) * 100)));
    payload.append('line_items[0][quantity]', '1');
    payload.append('customer_email', tenant.email);
    payload.append('invoice_creation[enabled]', 'true');
    payload.append('metadata[billId]', String(bill._id));
    payload.append('metadata[organizationId]', scopedOrganizationId);
    payload.append('metadata[tenantId]', bill.tenantId);

    const { data } = await axios.post('https://api.stripe.com/v1/checkout/sessions', payload.toString(), {
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    bill.paymentMode = 'stripe';
    bill.paymentToken = paymentToken;
    bill.stripeCheckoutStatus = data.status ?? 'open';
    bill.stripeCheckoutSessionId = data.id ?? null;
    bill.updatedByUserId = actor.id;
    bill.updatedByName = actor.fullName;
    bill.updatedByRole = actor.role;
    await bill.save();

    return {
      checkoutUrl: data.url,
      sessionId: data.id,
      token: paymentToken,
    };
  }

  async createResidentMonthlyStripeCheckout(
    organizationId: string,
    actor: JwtUser,
    monthKey: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<any> {
    const tenant = await this.resolveResidentTenant(organizationId, actor);

    if (!tenant) throw new NotFoundException('Tenant not found');
    const scopedOrganizationId = tenant.organizationId;
    const defaultCurrency = await this.getOrganizationDefaultCurrency(scopedOrganizationId);

    const kind = tenant.tenantKind === TenantKind.GUEST ? 'guest_fee' : 'rent';
    const existingBill = await this.billModel.findOne({
      organizationId: scopedOrganizationId,
      tenantId: String(tenant._id),
      kind,
      monthKey,
    });

    const paymentRecord = tenant.paymentRecords?.find((item) => item.monthKey === monthKey);
    const fallbackDueDate = this.buildDueDate(monthKey, tenant.rentDueDay ?? null);
    const amount =
      paymentRecord?.amount ??
      (tenant.tenantKind === TenantKind.GUEST
        ? tenant.oneTimeGuestFee ?? 0
        : tenant.monthlyRent ?? 0);

    if (!amount) {
      throw new BadRequestException('No payable rent or fee found for this month');
    }

    const bill =
      existingBill ??
      (await this.billModel.create({
        organizationId: scopedOrganizationId,
        tenantId: String(tenant._id),
        recipientUserId: tenant.userId ?? null,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId ?? null,
        kind,
        title: tenant.tenantKind === TenantKind.GUEST ? `Guest fee ${monthKey}` : `Monthly rent ${monthKey}`,
        description: tenant.tenantKind === TenantKind.GUEST ? 'Guest fee payment' : 'Monthly rent payment',
        amount,
        currency: defaultCurrency,
        monthKey,
        dueDate: paymentRecord?.dueDate ? new Date(paymentRecord.dueDate) : fallbackDueDate,
        status: BillStatus.UNPAID,
        attachments: [],
        note: paymentRecord?.note ?? null,
        createdBy: tenant.userId ?? actor.id,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
        paymentMode: 'manual',
      }));

    return this.createStripeCheckout(
      scopedOrganizationId,
      actor,
      String(bill._id),
      successUrl,
      cancelUrl,
    );
  }

  async verifyStripeCheckout(
    organizationId: string,
    actor: JwtUser,
    billId: string,
    sessionId: string,
    token: string,
  ): Promise<any> {
    const bill =
      (organizationId
        ? await this.billModel.findOne({ _id: billId, organizationId })
        : null) ??
      await this.billModel.findById(billId);
    if (!bill) throw new NotFoundException('Bill not found');
    await this.assertResidentCanAccessBill(actor, bill.toObject());

    if (!bill.paymentToken || bill.paymentToken !== token) {
      throw new BadRequestException('Payment token invalid');
    }

    const scopedOrganizationId = String(bill.organizationId);
    const stripeSecret = await this.getStripeSecret(scopedOrganizationId);
    const sessionResponse = await axios.get(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${stripeSecret}` },
    });
    const session = sessionResponse.data;

    bill.stripeCheckoutStatus = session.status ?? bill.stripeCheckoutStatus ?? null;
    bill.stripeCheckoutSessionId = session.id ?? bill.stripeCheckoutSessionId ?? null;
    bill.stripePaymentIntentId = session.payment_intent ?? bill.stripePaymentIntentId ?? null;
    bill.stripeInvoiceId = session.invoice ?? bill.stripeInvoiceId ?? null;
    bill.stripePaymentMethodType = Array.isArray(session.payment_method_types)
      ? session.payment_method_types[0] ?? null
      : null;
    bill.updatedByUserId = actor.id;
    bill.updatedByName = actor.fullName;
    bill.updatedByRole = actor.role;

    if (session.invoice) {
      try {
        const invoiceResponse = await axios.get(`https://api.stripe.com/v1/invoices/${session.invoice}`, {
          headers: { Authorization: `Bearer ${stripeSecret}` },
        });
        bill.stripeInvoicePdf = invoiceResponse.data.invoice_pdf ?? null;
        bill.stripeHostedInvoiceUrl = invoiceResponse.data.hosted_invoice_url ?? null;
      } catch {}
    }

    const paid = session.payment_status === 'paid';
    if (paid) {
      bill.status = BillStatus.PAID;
      bill.paidAt = new Date();
      bill.paymentVerifiedAt = new Date();
      await bill.save();
      await this.syncTenantPaymentFromBill(scopedOrganizationId, bill.toObject());
    } else {
      await bill.save();
    }

    return {
      paid,
      bill: [UserRole.RENTER, UserRole.GUEST].includes(actor.role)
        ? this.toResidentBill(bill.toObject())
        : bill.toObject(),
      sessionStatus: session.status ?? null,
      paymentStatus: session.payment_status ?? null,
    };
  }

  private async getStripeSecret(organizationId: string): Promise<string> {
    const organization = await this.organizationModel.findById(organizationId).lean();
    const secretKey = organization?.settings?.stripe?.secretKey;
    if (!organization || !secretKey) {
      throw new BadRequestException('Stripe not configured for this tenant owner');
    }
    return secretKey;
  }

  private async getOrganizationDefaultCurrency(organizationId: string): Promise<string> {
    const organization = await this.organizationModel.findById(organizationId).lean();
    return String(organization?.settings?.stripe?.defaultCurrency ?? 'usd').toUpperCase();
  }

  private async resolveResidentTenant(organizationId: string, actor: JwtUser) {
    return (
      (organizationId
        ? await this.tenantModel.findOne({
            organizationId,
            $or: [{ userId: actor.id }, { email: actor.email }],
          }).lean()
        : null) ??
      await this.tenantModel.findOne({
        $or: [{ userId: actor.id }, { email: actor.email }],
      }).sort({ createdAt: -1 }).lean()
    );
  }

  private async assertResidentCanAccessBill(actor: JwtUser, bill: any) {
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER].includes(actor.role)) {
      return;
    }
    if (![UserRole.RENTER, UserRole.GUEST].includes(actor.role)) {
      throw new NotFoundException('Bill not found');
    }
    const tenant = await this.tenantModel.findOne({
      _id: bill.tenantId,
      organizationId: bill.organizationId,
      $or: [{ userId: actor.id }, { email: actor.email }],
    }).lean();
    if (!tenant) throw new NotFoundException('Bill not found');
  }

  private async syncTenantPaymentFromBill(organizationId: string, bill: any) {
    const tenant = await this.tenantModel.findOne({ _id: bill.tenantId, organizationId });
    if (!tenant) return;
    const paymentMethod = bill.paymentMode === 'stripe' ? 'stripe' : 'manual';

    if (bill.kind === 'rent' && bill.monthKey) {
      const existing = tenant.paymentRecords.find((item) => item.monthKey === bill.monthKey);
      if (existing) {
        existing.amount = bill.amount;
        existing.status = TenantPaymentStatus.PAID;
        existing.paidAt = bill.paidAt ?? new Date();
        existing.dueDate = bill.dueDate ?? existing.dueDate;
        existing.paymentMethod = paymentMethod;
        existing.billId = String(bill._id);
        existing.stripeCheckoutSessionId = bill.stripeCheckoutSessionId ?? null;
        existing.stripePaymentIntentId = bill.stripePaymentIntentId ?? null;
        existing.stripeInvoiceId = bill.stripeInvoiceId ?? null;
        existing.stripeHostedInvoiceUrl = bill.stripeHostedInvoiceUrl ?? null;
        existing.stripeInvoicePdf = bill.stripeInvoicePdf ?? null;
        existing.note = bill.title;
      } else {
        tenant.paymentRecords.push({
          monthKey: bill.monthKey,
          amount: bill.amount,
          status: TenantPaymentStatus.PAID,
          paidAt: bill.paidAt ?? new Date(),
          dueDate: bill.dueDate ?? null,
          paymentMethod,
          billId: String(bill._id),
          stripeCheckoutSessionId: bill.stripeCheckoutSessionId ?? null,
          stripePaymentIntentId: bill.stripePaymentIntentId ?? null,
          stripeInvoiceId: bill.stripeInvoiceId ?? null,
          stripeHostedInvoiceUrl: bill.stripeHostedInvoiceUrl ?? null,
          stripeInvoicePdf: bill.stripeInvoicePdf ?? null,
          note: bill.title,
        } as any);
      }
    }

    if (bill.kind === 'guest_fee' || tenant.tenantKind === TenantKind.GUEST) {
      tenant.guestFeePaid = true;
    }

    await tenant.save();
  }

  private toResidentBill(bill: Record<string, any>) {
    const {
      organizationId,
      createdBy,
      paymentToken,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      stripeInvoiceId,
      ...safeBill
    } = bill;

    void organizationId;
    void createdBy;
    void paymentToken;
    void stripeCheckoutSessionId;
    void stripePaymentIntentId;
    void stripeInvoiceId;

    return safeBill;
  }

  private buildDueDate(monthKey?: string | null, dueDay?: number | null): Date | null {
    if (!monthKey || !dueDay) return null;
    const [yearString, monthString] = monthKey.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    if (!year || !month) return null;
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(Date.UTC(year, month - 1, Math.min(dueDay, lastDay)));
  }
}
