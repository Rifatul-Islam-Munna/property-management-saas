import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreateVendorQuoteDto } from './dto/create-vendor-quote.dto';
import { QueryVendorQuoteDto } from './dto/query-vendor-quote.dto';
import { UpdateVendorQuoteDto } from './dto/update-vendor-quote.dto';
import { VendorQuote, VendorQuoteDocument, VendorQuoteStatus } from './entities/vendor-quote.entity';

@Injectable()
export class VendorQuoteService {
  constructor(
    @InjectModel(VendorQuote.name)
    private readonly vendorQuoteModel: Model<VendorQuoteDocument>,
  ) {}

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
}
