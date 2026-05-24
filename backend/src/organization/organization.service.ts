import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization, OrganizationDocument } from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto): Promise<any> {
    const normalizedSlug = this.normalizeValue(dto.slug, 'Organization slug required');
    const existingSlug = await this.organizationModel
      .findOne({ slug: normalizedSlug })
      .lean();

    if (existingSlug) {
      throw new BadRequestException('An organization with this slug already exists');
    }

    const organization = await this.organizationModel.create({
      ...dto,
      slug: normalizedSlug,
      ownerId: userId,
    });

    return organization.toObject();
  }

  async findAll(query: QueryOrganizationDto): Promise<any> {
    const { page = 1, limit = 20, search, subscriptionStatus, isActive } = query;
    const filter: any = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (subscriptionStatus) {
      filter.subscriptionStatus = subscriptionStatus;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.organizationModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.organizationModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<any> {
    const organization = await this.organizationModel.findById(id).lean();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<any> {
    if (dto.slug) {
      const normalizedSlug = this.normalizeValue(dto.slug, 'Organization slug required');
      const existingSlug = await this.organizationModel
        .findOne({ slug: normalizedSlug, _id: { $ne: id } })
        .lean();

      if (existingSlug) {
        throw new BadRequestException('An organization with this slug already exists');
      }
    }

    const organization = await this.organizationModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          slug: dto.slug ? this.normalizeValue(dto.slug, 'Organization slug required') : dto.slug,
        },
        { new: true },
      )
      .lean();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const organization = await this.organizationModel.findByIdAndDelete(id).lean();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return { deleted: true };
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    return this.organizationModel
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .lean();
  }

  private normalizeValue(value?: string, message = 'Value required'): string {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      throw new BadRequestException(message);
    }

    return normalizedValue;
  }
}
