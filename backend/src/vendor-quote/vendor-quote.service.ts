import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import type { JwtUser } from 'src/lib/auth.guard';
import { MailDeliveryService } from 'src/notification/mail-delivery.service';
import { CreateVendorMarketplaceRequestDto } from './dto/create-vendor-marketplace-request.dto';
import { CreateVendorQuoteDto } from './dto/create-vendor-quote.dto';
import { QueryVendorQuoteDto } from './dto/query-vendor-quote.dto';
import { SubmitVendorMarketplaceQuoteDto } from './dto/submit-vendor-marketplace-quote.dto';
import { UpdateVendorQuoteDto } from './dto/update-vendor-quote.dto';
import { VendorQuote, VendorQuoteDocument, VendorQuoteStatus } from './entities/vendor-quote.entity';
import {
  VendorQuoteRequest,
  VendorQuoteRequestDocument,
  VendorQuoteRequestStatus,
  VendorQuoteSubmissionStatus,
} from './entities/vendor-quote-request.entity';

@Injectable()
export class VendorQuoteService {
  constructor(
    @InjectModel(VendorQuote.name)
    private readonly vendorQuoteModel: Model<VendorQuoteDocument>,
    @InjectModel(VendorQuoteRequest.name)
    private readonly vendorQuoteRequestModel: Model<VendorQuoteRequestDocument>,
    private readonly mailDeliveryService: MailDeliveryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createMarketplaceRequest(
    organizationId: string,
    actor: JwtUser,
    dto: CreateVendorMarketplaceRequestDto,
  ): Promise<any> {
    const request = await this.vendorQuoteRequestModel.create({
      ...dto,
      organizationId,
      currency: dto.currency?.toUpperCase() ?? 'USD',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      attachments: dto.attachments ?? [],
      submissions: [],
      createdByUserId: actor.id,
      createdByName: actor.fullName,
      createdByRole: actor.role,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    await this.auditLogService.record({
      organizationId,
      actor,
      action: 'vendor_marketplace_request_created',
      entityType: 'vendor_quote_request',
      entityId: String(request._id),
      metadata: { title: request.title, budgetAmount: request.budgetAmount },
    });
    return request.toObject();
  }

  async findMarketplaceRequests(organizationId: string): Promise<any> {
    const data = await this.vendorQuoteRequestModel
      .find({ organizationId })
      .sort({ createdAt: -1 })
      .lean();
    return { data, total: data.length, page: 1, limit: data.length || 20, totalPages: data.length ? 1 : 0 };
  }

  async getPublicMarketplaceRequest(id: string): Promise<any> {
    const request = await this.vendorQuoteRequestModel.findById(id).lean();
    if (!request || request.status !== VendorQuoteRequestStatus.OPEN) {
      throw new NotFoundException('Vendor quote request not found');
    }

    return {
      _id: String(request._id),
      title: request.title,
      description: request.description ?? null,
      budgetAmount: request.budgetAmount ?? null,
      currency: request.currency,
      dueDate: request.dueDate ?? null,
      attachments: request.attachments ?? [],
      status: request.status,
    };
  }

  async submitPublicMarketplaceQuote(
    id: string,
    dto: SubmitVendorMarketplaceQuoteDto,
  ): Promise<any> {
    const request = await this.vendorQuoteRequestModel.findById(id);
    if (!request || request.status !== VendorQuoteRequestStatus.OPEN) {
      throw new NotFoundException('Vendor quote request not found');
    }

    request.submissions.push({
      vendorName: dto.vendorName.trim(),
      vendorEmail: dto.vendorEmail.trim().toLowerCase(),
      vendorPhone: dto.vendorPhone?.trim() || null,
      amount: dto.amount,
      currency: dto.currency?.trim().toUpperCase() ?? request.currency ?? 'USD',
      timeline: dto.timeline?.trim() || null,
      proposalNote: dto.proposalNote?.trim() || null,
      paymentTerms: dto.paymentTerms?.trim() || null,
      attachments: dto.attachments ?? [],
      status: VendorQuoteSubmissionStatus.SUBMITTED,
    } as any);
    request.updatedByName = dto.vendorName.trim();
    await request.save();

    await this.auditLogService.record({
      organizationId: request.organizationId,
      action: 'vendor_marketplace_quote_submitted',
      entityType: 'vendor_quote_request',
      entityId: String(request._id),
      metadata: { vendorName: dto.vendorName, amount: dto.amount, currency: dto.currency ?? request.currency },
    });

    const submission = request.submissions[request.submissions.length - 1] as any;
    return {
      submissionId: String(submission._id),
      status: submission.status,
      title: request.title,
    };
  }

  async selectMarketplaceSubmission(
    organizationId: string,
    actor: JwtUser,
    id: string,
    submissionId: string,
  ): Promise<any> {
    const request = await this.vendorQuoteRequestModel.findOne({ _id: id, organizationId });
    if (!request) throw new NotFoundException('Vendor quote request not found');

    const selectedSubmission = request.submissions.find((item: any) => String(item._id) === submissionId);
    if (!selectedSubmission) throw new NotFoundException('Vendor submission not found');

    for (const submission of request.submissions as any[]) {
      const selected = String(submission._id) === submissionId;
      submission.status = selected ? VendorQuoteSubmissionStatus.SELECTED : VendorQuoteSubmissionStatus.REJECTED;
      submission.selectedAt = selected ? new Date() : null;
      this.mailDeliveryService.sendFireAndForget({
        to: submission.vendorEmail,
        subject: selected ? `Selected: ${request.title}` : `Quote update: ${request.title}`,
        body: this.renderVendorMessage(
          selected ? request.winnerMessageTemplate : request.rejectionMessageTemplate,
          request,
          submission,
        ),
      });
    }

    request.status = VendorQuoteRequestStatus.AWARDED;
    request.selectedSubmissionId = submissionId;
    request.updatedByUserId = actor.id;
    request.updatedByName = actor.fullName;
    request.updatedByRole = actor.role;
    await request.save();

    await this.auditLogService.record({
      organizationId,
      actor,
      action: 'vendor_marketplace_submission_selected',
      entityType: 'vendor_quote_request',
      entityId: id,
      metadata: { submissionId, vendorName: selectedSubmission.vendorName, amount: selectedSubmission.amount },
    });

    return request.toObject();
  }

  async create(organizationId: string, actor: JwtUser, dto: CreateVendorQuoteDto): Promise<any> {
    const quote = await this.vendorQuoteModel.create({
      ...dto,
      organizationId,
      currency: dto.currency?.toUpperCase() ?? 'USD',
      attachments: dto.attachments ?? [],
      approvedAt: dto.status === VendorQuoteStatus.APPROVED ? new Date() : null,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });
    return quote.toObject();
  }

  async findAll(organizationId: string, query: QueryVendorQuoteDto): Promise<any> {
    const { page = 1, limit = 20, vendorId, propertyId, status } = query;
    const filter: Record<string, unknown> = { organizationId };
    if (vendorId) filter.vendorId = vendorId;
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.vendorQuoteModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).lean(),
      this.vendorQuoteModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateVendorQuoteDto): Promise<any> {
    const quote = await this.vendorQuoteModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        currency: dto.currency?.toUpperCase(),
        approvedAt: dto.status === VendorQuoteStatus.APPROVED ? new Date() : undefined,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!quote) throw new NotFoundException('Vendor quote not found');
    return quote.toObject();
  }

  async remove(organizationId: string, id: string): Promise<any> {
    const quote = await this.vendorQuoteModel.findOneAndDelete({ _id: id, organizationId });
    if (!quote) throw new NotFoundException('Vendor quote not found');
    return { deleted: true };
  }

  private renderVendorMessage(template: string, request: VendorQuoteRequestDocument, submission: any) {
    const variables: Record<string, string> = {
      vendor_name: submission.vendorName ?? '',
      request_title: request.title ?? '',
      amount: String(submission.amount ?? ''),
      currency: submission.currency ?? request.currency ?? 'USD',
      owner_name: request.updatedByName ?? request.createdByName ?? '',
    };

    return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => variables[key] ?? '');
  }
}
