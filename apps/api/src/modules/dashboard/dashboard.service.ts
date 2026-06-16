import { Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: AuthenticatedUser) {
    const companyId = user.companyId;

    const [
      totalUsers,
      totalDocuments,
      totalChats,
      totalTickets,
      openTickets,
      unansweredQuestions,
      ticketsByCategory,
      recentTickets,
    ] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.document.count({ where: { companyId } }),
      this.prisma.chatSession.count({ where: { companyId } }),
      this.prisma.ticket.count({ where: { companyId } }),
      this.prisma.ticket.count({
        where: {
          companyId,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.PENDING] },
        },
      }),
      this.prisma.chatMessage.count({
        where: { suggestTicket: true, session: { companyId } },
      }),
      this.prisma.ticket.groupBy({
        by: ['category'],
        where: { companyId },
        _count: { category: true },
      }),
      this.prisma.ticket.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          category: true,
          createdAt: true,
        },
      }),
    ]);

    const mostAskedTopics = ticketsByCategory.map((t) => ({
      category: t.category,
      count: t._count.category,
    }));

    return successResponse({
      totalUsers,
      totalDocuments,
      totalChats,
      totalTickets,
      openTickets,
      unansweredQuestions,
      mostAskedTopics,
      recentTickets,
    });
  }
}
