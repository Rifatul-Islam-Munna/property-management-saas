import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { Bill, BillDocument, BillKind, BillStatus } from 'src/bill/entities/bill.entity';
import { Organization, OrganizationDocument } from 'src/organization/entities/organization.entity';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Tenant, TenantDocument, TenantKind, TenantPaymentStatus } from 'src/tenant/entities/tenant.entity';
import { Ticket, TicketDocument, TicketStatus } from 'src/ticket/entities/ticket.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { CreatePublicCheckoutDto } from './dto/create-public-checkout.dto';
import { CreatePublicTicketDto } from './dto/create-public-ticket.dto';
import { UpdatePublicTicketDto } from './dto/update-public-ticket.dto';
import { VerifyPublicCheckoutDto } from './dto/verify-public-checkout.dto';

@Injectable()
export class PublicRequestService {
  constructor(
    @InjectModel(Bill.name) private readonly billModel: Model<BillDocument>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getTenantPortal(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant || !tenant.isActive) throw new NotFoundException('Tenant not found');

    const [organization, property, unit, bills] = await Promise.all([
      this.organizationModel.findById(tenant.organizationId).select({ name: 1, logo: 1, settings: 1 }).lean(),
      this.propertyModel.findById(tenant.propertyId).select({ name: 1, address: 1, contactPhone: 1, contactEmail: 1 }).lean(),
      tenant.unitId ? this.unitModel.findById(tenant.unitId).select({ unitNumber: 1 }).lean() : null,
      this.billModel
        .find({
          organizationId: tenant.organizationId,
          tenantId: String(tenant._id),
          status: { $in: [BillStatus.UNPAID, BillStatus.PARTIAL, BillStatus.OVERDUE] },
        })
        .sort({ dueDate: 1, createdAt: -1 })
        .lean(),
    ]);

    const branding = organization?.settings?.branding ?? {};
    return {
      tenant: {
        id: String(tenant._id),
        fullName: tenant.fullName,
        tenantKind: tenant.tenantKind,
        email: tenant.email,
        phone: tenant.phone,
        monthlyRent: tenant.monthlyRent ?? null,
        rentDueDay: tenant.rentDueDay ?? null,
        oneTimeGuestFee: tenant.oneTimeGuestFee ?? null,
        guestFeePaid: tenant.guestFeePaid ?? false,
      },
      organization: {
        name: organization?.name ?? 'Property team',
        logo: branding.logoUrl ?? organization?.logo ?? null,
        stripeConfigured: Boolean(organization?.settings?.stripe?.secretKey),
        currency: String(organization?.settings?.stripe?.defaultCurrency ?? 'usd').toUpperCase(),
      },
      property: property
        ? {
            name: property.name,
            address: property.address ?? null,
            contactPhone: property.contactPhone ?? null,
            contactEmail: property.contactEmail ?? null,
          }
        : null,
      unit: unit ? { unitNumber: unit.unitNumber } : null,
      bills: bills.map((bill) => this.toPublicBill(bill)),
    };
  }

  async createCheckout(tenantId: string, dto: CreatePublicCheckoutDto) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant || !tenant.isActive) throw new NotFoundException('Tenant not found');

    const bill = dto.billId
      ? await this.billModel.findOne({ _id: dto.billId, tenantId, organizationId: tenant.organizationId })
      : await this.resolveOrCreateCurrentBill(tenant, dto.monthKey);
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status === BillStatus.PAID) throw new BadRequestException('Bill already paid');

    const stripeSecret = await this.getStripeSecret(tenant.organizationId);
    const paymentToken = randomUUID();
    const successUrl = `${dto.successUrl}${dto.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&bill=${bill._id}&token=${paymentToken}`;
    const cancelUrl = `${dto.cancelUrl}${dto.cancelUrl.includes('?') ? '&' : '?'}bill=${bill._id}&token=${paymentToken}`;

    const payload = new URLSearchParams();
    payload.append('mode', 'payment');
    payload.append('success_url', successUrl);
    payload.append('cancel_url', cancelUrl);
    payload.append('line_items[0][price_data][currency]', String(bill.currency ?? 'usd').toLowerCase());
    payload.append('line_items[0][price_data][product_data][name]', bill.title);
    payload.append('line_items[0][price_data][product_data][description]', bill.description ?? bill.note ?? '');
    payload.append('line_items[0][price_data][unit_amount]', String(Math.round((bill.amount ?? 0) * 100)));
    payload.append('line_items[0][quantity]', '1');
    payload.append('customer_email', tenant.email);
    payload.append('invoice_creation[enabled]', 'true');
    payload.append('metadata[billId]', String(bill._id));
    payload.append('metadata[organizationId]', tenant.organizationId);
    payload.append('metadata[tenantId]', String(tenant._id));
    payload.append('metadata[source]', 'public_qr');

    const { data } = await axios.post('https://api.stripe.com/v1/checkout/sessions', payload.toString(), {
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    bill.paymentMode = 'stripe_public_qr';
    bill.paymentToken = paymentToken;
    bill.stripeCheckoutStatus = data.status ?? 'open';
    bill.stripeCheckoutSessionId = data.id ?? null;
    bill.updatedByName = 'Public QR payer';
    await bill.save();
    await this.auditLogService.record({
      organizationId: tenant.organizationId,
      action: 'public_qr_checkout_created',
      entityType: 'bill',
      entityId: String(bill._id),
      metadata: { tenantId: String(tenant._id), amount: bill.amount, monthKey: bill.monthKey },
    });

    return { checkoutUrl: data.url, sessionId: data.id, token: paymentToken, billId: String(bill._id) };
  }

  async verifyCheckout(tenantId: string, dto: VerifyPublicCheckoutDto) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant) throw new NotFoundException('Tenant not found');

    const bill = await this.billModel.findOne({ _id: dto.billId, tenantId, organizationId: tenant.organizationId });
    if (!bill) throw new NotFoundException('Bill not found');
    if (!bill.paymentToken || bill.paymentToken !== dto.token) throw new BadRequestException('Payment token invalid');

    const stripeSecret = await this.getStripeSecret(tenant.organizationId);
    const sessionResponse = await axios.get(`https://api.stripe.com/v1/checkout/sessions/${dto.sessionId}`, {
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
    bill.updatedByName = 'Public QR payer';

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
      await this.syncTenantPaymentFromBill(tenant.organizationId, bill.toObject());
      await this.auditLogService.record({
        organizationId: tenant.organizationId,
        action: 'public_qr_payment_verified',
        entityType: 'bill',
        entityId: String(bill._id),
        metadata: { tenantId: String(tenant._id), sessionId: dto.sessionId, amount: bill.amount },
      });
    } else {
      await bill.save();
    }

    return { paid, bill: this.toPublicBill(bill.toObject()), paymentStatus: session.payment_status ?? null };
  }

  async createTicket(tenantId: string, dto: CreatePublicTicketDto) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant || !tenant.isActive) throw new NotFoundException('Tenant not found');

    const contactParts = [
      dto.contactName ? `Name: ${dto.contactName}` : null,
      dto.contactEmail ? `Email: ${dto.contactEmail}` : null,
      dto.contactPhone ? `Phone: ${dto.contactPhone}` : null,
    ].filter(Boolean);

    const ticket = await this.ticketModel.create({
      organizationId: tenant.organizationId,
      propertyId: tenant.propertyId,
      unitId: tenant.unitId ?? null,
      tenantId: String(tenant._id),
      title: dto.title,
      description: contactParts.length ? `${dto.description}\n\nPublic QR contact:\n${contactParts.join('\n')}` : dto.description,
      category: dto.category,
      priority: dto.priority,
      status: TicketStatus.OPEN,
      images: dto.images ?? [],
      createdBy: tenant.userId ?? `public:${tenant._id}`,
      updatedByName: dto.contactName ?? tenant.fullName,
      timeline: [
        {
          action: 'created_public_qr',
          performedBy: tenant.userId ?? `public:${tenant._id}`,
          performedAt: new Date(),
          details: 'Ticket created from public QR page',
        },
      ],
    });
    await this.auditLogService.record({
      organizationId: tenant.organizationId,
      action: 'public_qr_ticket_created',
      entityType: 'ticket',
      entityId: String(ticket._id),
      metadata: { tenantId: String(tenant._id), title: ticket.title, priority: ticket.priority },
    });

    return {
      _id: String(ticket._id),
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.get('createdAt') ?? null,
    };
  }

  async getTicket(ticketId: string) {
    const ticket = await this.ticketModel.findById(ticketId).lean();
    if (!ticket) throw new NotFoundException('Ticket not found');

    const [property, unit, tenant, organization] = await Promise.all([
      this.propertyModel.findById(ticket.propertyId).select({ name: 1, address: 1 }).lean(),
      ticket.unitId ? this.unitModel.findById(ticket.unitId).select({ unitNumber: 1 }).lean() : null,
      ticket.tenantId ? this.tenantModel.findById(ticket.tenantId).select({ fullName: 1 }).lean() : null,
      this.organizationModel.findById(ticket.organizationId).select({ name: 1, logo: 1, settings: 1 }).lean(),
    ]);

    const branding = organization?.settings?.branding ?? {};
    return {
      _id: String(ticket._id),
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      images: ticket.images ?? [],
      completionProof: ticket.completionProof ?? [],
      completionNotes: ticket.completionNotes ?? null,
      comments: (ticket.comments ?? []).map((comment) => ({
        userName: comment.userName,
        content: comment.content,
        createdAt: comment.createdAt,
      })),
      organization: {
        name: organization?.name ?? 'Property team',
        logo: branding.logoUrl ?? organization?.logo ?? null,
      },
      property: property ? { name: property.name, address: property.address ?? null } : null,
      unit: unit ? { unitNumber: unit.unitNumber } : null,
      tenant: tenant ? { fullName: tenant.fullName } : null,
    };
  }

  async updateTicket(ticketId: string, dto: UpdatePublicTicketDto) {
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const changes: string[] = [];
    if (dto.status && dto.status !== ticket.status) {
      ticket.status = dto.status;
      changes.push(`status:${dto.status}`);
      if (dto.status === TicketStatus.COMPLETED) {
        ticket.resolvedAt = ticket.resolvedAt ?? new Date();
      }
    }

    if (dto.completionNotes?.trim()) {
      ticket.completionNotes = dto.completionNotes.trim();
      changes.push('completion_notes');
    }

    if (dto.comment?.trim()) {
      ticket.comments.push({
        userId: `public:${ticketId}`,
        userName: 'Public ticket updater',
        content: dto.comment.trim(),
        createdAt: new Date(),
      });
      changes.push('comment');
    }

    if (dto.images?.length) {
      ticket.completionProof = Array.from(new Set([...(ticket.completionProof ?? []), ...dto.images]));
      changes.push('proof_images');
    }

    if (!changes.length) throw new BadRequestException('No ticket update provided');

    ticket.updatedByUserId = `public:${ticketId}`;
    ticket.updatedByName = 'Public ticket updater';
    ticket.timeline.push({
      action: 'public_qr_updated',
      performedBy: `public:${ticketId}`,
      performedAt: new Date(),
      details: `Updated from public ticket QR: ${changes.join(', ')}`,
    });
    await ticket.save();
    await this.auditLogService.record({
      organizationId: ticket.organizationId,
      action: 'public_ticket_qr_updated',
      entityType: 'ticket',
      entityId: String(ticket._id),
      metadata: { status: ticket.status, changes },
    });

    return this.getTicket(String(ticket._id));
  }

  private async resolveOrCreateCurrentBill(tenant: any, monthKey?: string | null) {
    const activeMonth = monthKey?.trim() || new Date().toISOString().slice(0, 7);
    const kind = tenant.tenantKind === TenantKind.GUEST ? BillKind.GUEST_FEE : BillKind.RENT;
    const existing = await this.billModel.findOne({
      organizationId: tenant.organizationId,
      tenantId: String(tenant._id),
      kind,
      monthKey: activeMonth,
    });
    if (existing) return existing;

    const amount = tenant.tenantKind === TenantKind.GUEST ? tenant.oneTimeGuestFee ?? 0 : tenant.monthlyRent ?? 0;
    if (!amount) throw new BadRequestException('No payable amount found');

    const organization = await this.organizationModel.findById(tenant.organizationId).lean();
    return this.billModel.create({
      organizationId: tenant.organizationId,
      tenantId: String(tenant._id),
      recipientUserId: tenant.userId ?? null,
      propertyId: tenant.propertyId,
      unitId: tenant.unitId ?? null,
      kind,
      title: tenant.tenantKind === TenantKind.GUEST ? `Guest fee ${activeMonth}` : `Monthly rent ${activeMonth}`,
      description: tenant.tenantKind === TenantKind.GUEST ? 'Guest fee payment from public QR' : 'Monthly rent payment from public QR',
      amount,
      currency: String(organization?.settings?.stripe?.defaultCurrency ?? 'usd').toUpperCase(),
      monthKey: activeMonth,
      dueDate: this.buildDueDate(activeMonth, tenant.rentDueDay ?? null),
      status: BillStatus.UNPAID,
      attachments: [],
      note: 'Auto-created from public QR payment page',
      createdBy: tenant.userId ?? `public:${tenant._id}`,
      updatedByName: 'Public QR payer',
      paymentMode: 'manual',
    });
  }

  private async getStripeSecret(organizationId: string) {
    const organization = await this.organizationModel.findById(organizationId).lean();
    const secretKey = organization?.settings?.stripe?.secretKey;
    if (!secretKey) throw new BadRequestException('Stripe not configured for this tenant owner');
    return secretKey;
  }

  private async syncTenantPaymentFromBill(organizationId: string, bill: any) {
    const tenant = await this.tenantModel.findOne({ _id: bill.tenantId, organizationId });
    if (!tenant) return;

    if (bill.kind === BillKind.RENT && bill.monthKey) {
      const existing = tenant.paymentRecords.find((item) => item.monthKey === bill.monthKey);
      if (existing) {
        existing.amount = bill.amount;
        existing.status = TenantPaymentStatus.PAID;
        existing.paidAt = bill.paidAt ?? new Date();
        existing.dueDate = bill.dueDate ?? existing.dueDate;
        existing.paymentMethod = 'stripe';
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
          paymentMethod: 'stripe',
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

    if (bill.kind === BillKind.GUEST_FEE || tenant.tenantKind === TenantKind.GUEST) {
      tenant.guestFeePaid = true;
    }

    await tenant.save();
  }

  private toPublicBill(bill: Record<string, any>) {
    return {
      _id: String(bill._id),
      kind: bill.kind,
      title: bill.title,
      description: bill.description ?? null,
      amount: bill.amount,
      currency: bill.currency ?? 'USD',
      monthKey: bill.monthKey ?? null,
      dueDate: bill.dueDate ?? null,
      status: bill.status,
      paidAt: bill.paidAt ?? null,
      stripeHostedInvoiceUrl: bill.stripeHostedInvoiceUrl ?? null,
      stripeInvoicePdf: bill.stripeInvoicePdf ?? null,
    };
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
