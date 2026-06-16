import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { paginate, successResponse } from '../../common/utils/api-response.util';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser, query: TicketFilterDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      companyId: user.companyId,
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
      ...(query.priority && { priority: query.priority }),
      ...(query.search && {
        OR: [
          { subject: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const result = paginate(tickets, total, page, limit);
    return successResponse(result.data, 'Tickets retrieved', result.meta);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return successResponse(ticket);
  }

  async create(user: AuthenticatedUser, dto: CreateTicketDto) {
    const lastTicket = await this.prisma.ticket.findFirst({
      where: { companyId: user.companyId },
      orderBy: { ticketNumber: 'desc' },
    });

    const ticketNumber = (lastTicket?.ticketNumber ?? 1000) + 1;

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          ticketNumber,
          subject: dto.subject,
          description: dto.description,
          category: dto.category,
          priority: dto.priority,
          companyId: user.companyId,
          createdById: user.id,
          departmentId: dto.departmentId,
        },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: created.id,
          actorId: user.id,
          action: 'TICKET_CREATED',
          metadata: { category: dto.category, priority: dto.priority },
        },
      });

      return created;
    });

    return successResponse(ticket, 'Ticket created');
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateTicketDto) {
    const existing = await this.prisma.ticket.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw new NotFoundException('Ticket not found');

    const ticket = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: dto,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
        },
      });

      if (dto.status && dto.status !== existing.status) {
        await tx.ticketActivity.create({
          data: {
            ticketId: id,
            actorId: user.id,
            action: 'STATUS_CHANGED',
            metadata: { from: existing.status, to: dto.status },
          },
        });
      }

      if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
        await tx.ticketActivity.create({
          data: {
            ticketId: id,
            actorId: user.id,
            action: 'ASSIGNED',
            metadata: { assigneeId: dto.assigneeId },
          },
        });
      }

      return updated;
    });

    return successResponse(ticket, 'Ticket updated');
  }

  async addComment(
    user: AuthenticatedUser,
    ticketId: string,
    dto: CreateCommentDto,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, companyId: user.companyId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticketComment.create({
        data: {
          ticketId,
          authorId: user.id,
          content: dto.content,
          isInternal: dto.isInternal ?? false,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId,
          actorId: user.id,
          action: 'COMMENT_ADDED',
        },
      });

      return created;
    });

    return successResponse(comment, 'Comment added');
  }
}
