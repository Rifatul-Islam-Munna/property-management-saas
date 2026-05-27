import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import {
  Announcement,
  AnnouncementType,
  AnnouncementDocument,
  NoticeAudience,
} from './entities/announcement.entity';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateAnnouncementDto) {
    const announcement = await this.announcementModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
      audience: dto.audience ?? NoticeAudience.ALL,
      targetRoles: dto.targetRoles ?? [],
      targetUserIds: dto.targetUserIds ?? [],
      attachments: dto.attachments ?? [],
    });
    return announcement.toObject();
  }

  async findAll(organizationId: string, query: QueryAnnouncementDto, actor?: JwtUser) {
    const {
      page = 1,
      limit = 20,
      propertyId,
      type,
      audience,
      targetRole,
      isActive,
      fromDate,
      toDate,
    } = query;
    const filter: Record<string, unknown> = { organizationId };

    if (propertyId) filter.propertyId = propertyId;
    if (type) filter.type = type;
    if (audience) filter.audience = audience;
    if (targetRole) filter.targetRoles = targetRole;
    if (isActive !== undefined) filter.isActive = isActive;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) (filter.createdAt as Record<string, Date>).$gte = new Date(fromDate);
      if (toDate) (filter.createdAt as Record<string, Date>).$lte = new Date(toDate);
    }

    if (actor && !['super_admin', 'admin', 'tetentwoner'].includes(actor.role)) {
      filter.$or = [
        { audience: NoticeAudience.ALL },
        { targetRoles: actor.role },
        { targetUserIds: actor.id },
      ];
    }

    const [data, total] = await Promise.all([
      this.announcementModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.announcementModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sendNoticeToTenantUsers(
    organizationId: string,
    actor: JwtUser,
    dto: CreateAnnouncementDto,
  ) {
    const notice = await this.announcementModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
      type: AnnouncementType.NOTICE,
      audience: dto.audience ?? NoticeAudience.ROLE_BASED,
      targetRoles: dto.targetRoles?.length ? dto.targetRoles : ['renter', 'guest'],
      targetUserIds: dto.targetUserIds ?? [],
      attachments: dto.attachments ?? [],
    });

    return notice.toObject();
  }

  async findById(organizationId: string, id: string) {
    const announcement = await this.announcementModel.findOne({ _id: id, organizationId }).lean();
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.announcementModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...dto,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement.toObject();
  }

  async remove(organizationId: string, id: string) {
    const announcement = await this.announcementModel.findOneAndDelete({ _id: id, organizationId });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return { deleted: true };
  }
}
