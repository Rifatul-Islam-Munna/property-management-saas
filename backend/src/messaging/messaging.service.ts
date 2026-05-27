import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { QueryMessageDto } from './dto/query-message.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Message, MessageDocument, MessageKind } from './entities/message.entity';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async sendMessage(organizationId: string, actor: JwtUser, dto: SendMessageDto): Promise<any> {
    const message = await this.messageModel.create({
      organizationId,
      roomType: dto.roomType,
      roomId: dto.roomId,
      senderId: actor.id,
      recipientIds: [],
      senderName: actor.email,
      kind: MessageKind.TEXT,
      content: dto.content,
      attachments: dto.attachments ?? [],
      readBy: [actor.id],
    });

    const payload = message.toObject();
    this.messagingGateway.emitMessage(dto.roomId, payload);
    return payload;
  }

  async findMessages(organizationId: string, actor: JwtUser, query: QueryMessageDto): Promise<any> {
    const { page = 1, limit = 20, roomId, roomType } = query;
    const filter: Record<string, unknown> =
      actor.role === 'worker' ? {} : { organizationId };
    if (roomId) filter.roomId = roomId;
    if (roomType) filter.roomType = roomType;

    if (!['super_admin', 'admin', 'tetentwoner'].includes(actor.role)) {
      filter.$or = [
        { senderId: actor.id },
        { recipientIds: actor.id },
        { roomId: { $regex: actor.id } },
      ];
    }

    const [data, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.messageModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sendDocumentToUsers(
    organizationId: string,
    actor: JwtUser,
    dto: SendDocumentDto,
  ): Promise<any[]> {
    const docs: any[] = [];

    for (const recipientId of dto.recipientIds) {
      const roomId = [actor.id, recipientId].sort().join(':');
      const message = await this.messageModel.create({
        organizationId,
        roomType: 'direct',
        roomId,
        senderId: actor.id,
        recipientIds: [recipientId],
        senderName: actor.email,
        kind: MessageKind.DOCUMENT,
        content: dto.note ?? dto.title ?? 'Document shared',
        attachments: [dto.documentUrl],
        readBy: [actor.id],
      });

      const payload = message.toObject();
      this.messagingGateway.emitMessage(roomId, payload);
      docs.push(payload);
    }

    return docs;
  }

  async markRead(organizationId: string, id: string, userId: string): Promise<any> {
    const message = await this.messageModel.findOne({
      _id: id,
      $or: [{ organizationId }, { senderId: userId }, { recipientIds: userId }, { roomId: { $regex: userId } }],
    });
    if (!message) throw new NotFoundException('Message not found');
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }
    return message.toObject();
  }
}
