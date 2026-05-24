import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketService } from './ticket.service';

@ApiTags('ticket')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async create(@Req() req: ExpressRequest, @Body() dto: CreateTicketDto) {
    const data = await this.ticketService.create(req.user.organizationId ?? '', req.user, dto);
    return new SuccessResponseDto(201, 'Ticket created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async findAll(@Req() req: ExpressRequest, @Query() query: QueryTicketDto) {
    const data = await this.ticketService.findAll(req.user.organizationId ?? '', query);
    return new SuccessResponseDto(200, 'Ticket list fetched', data);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async findById(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.ticketService.findById(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Ticket fetched', data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async update(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    const data = await this.ticketService.update(req.user.organizationId ?? '', id, req.user, dto);
    return new SuccessResponseDto(200, 'Ticket updated successfully', data);
  }

  @Patch(':id/assign/:assignedTo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async assign(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Param('assignedTo') assignedTo: string,
  ) {
    const data = await this.ticketService.assign(
      req.user.organizationId ?? '',
      id,
      req.user,
      assignedTo,
    );
    return new SuccessResponseDto(200, 'Ticket assigned successfully', data);
  }

  @Post(':id/comments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TETENTWONER,
    UserRole.WORKER,
    UserRole.RENTER,
    UserRole.GUEST,
  )
  async addComment(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: AddCommentDto,
  ) {
    const data = await this.ticketService.addComment(req.user.organizationId ?? '', id, req.user, dto);
    return new SuccessResponseDto(201, 'Ticket comment added', data);
  }

  @Post(':id/internal-notes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER, UserRole.WORKER)
  async addInternalNote(
    @Req() req: ExpressRequest,
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: AddCommentDto,
  ) {
    const data = await this.ticketService.addInternalNote(
      req.user.organizationId ?? '',
      id,
      req.user,
      dto,
    );
    return new SuccessResponseDto(201, 'Ticket internal note added', data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async remove(@Req() req: ExpressRequest, @Param('id', MongoIdPipe) id: string) {
    const data = await this.ticketService.remove(req.user.organizationId ?? '', id);
    return new SuccessResponseDto(200, 'Ticket deleted successfully', data);
  }
}
