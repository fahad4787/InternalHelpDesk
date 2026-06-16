import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';
import { SendMessageDto } from './dto/send-message.dto';
import { askQuestion } from './utils/query.util';

interface SourceReference {
  documentId: string;
  documentTitle: string;
  source?: string;
  chunkIndex: number;
  excerpt: string;
  section?: string;
  score: number;
}

function formatDocumentTitle(title: string, source?: string): string {
  if (source === 'WORKDAY') return `Workday - ${title}`;
  return title;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getSessions(user: AuthenticatedUser) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId: user.id, companyId: user.companyId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        _count: { select: { messages: true } },
      },
    });

    return successResponse(sessions);
  }

  async getSession(user: AuthenticatedUser, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id, companyId: user.companyId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) throw new NotFoundException('Session not found');
    return successResponse(session);
  }

  async deleteSession(user: AuthenticatedUser, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id, companyId: user.companyId },
    });

    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.chatSession.delete({ where: { id: sessionId } });
    return successResponse(null, 'Chat session deleted');
  }

  async sendMessage(user: AuthenticatedUser, dto: SendMessageDto) {
    let sessionId = dto.sessionId;

    if (!sessionId) {
      const session = await this.prisma.chatSession.create({
        data: {
          title: dto.content.slice(0, 80),
          companyId: user.companyId,
          userId: user.id,
        },
      });
      sessionId = session.id;
    }

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: dto.content,
      },
    });

    const { answer, sources, confidence, suggestTicket } =
      await this.generateAnswer(user.companyId, dto.content);

    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: answer,
        sources: sources as unknown as object,
        confidence,
        suggestTicket,
      },
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return successResponse({
      sessionId,
      message: assistantMessage,
      suggestTicket,
    });
  }

  private mergeChunksByDocument(
    chunks: {
      content: string;
      chunkIndex: number;
      document: { id: string; title: string; source?: string };
    }[],
  ) {
    const byDocument = new Map<
      string,
      { content: string; chunkIndex: number; document: { id: string; title: string; source?: string } }
    >();

    for (const chunk of chunks) {
      const existing = byDocument.get(chunk.document.id);
      if (existing) {
        existing.content = `${existing.content}\n${chunk.content}`;
      } else {
        byDocument.set(chunk.document.id, {
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          document: chunk.document,
        });
      }
    }

    return [...byDocument.values()];
  }

  private async generateAnswer(companyId: string, question: string) {
    const chunks = await this.prisma.documentChunk.findMany({
      where: { document: { companyId, status: 'READY' } },
      include: { document: { select: { id: true, title: true, source: true } } },
      orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }],
      take: 200,
    });

    const mergedChunks = this.mergeChunksByDocument(chunks);
    const result = askQuestion(question, mergedChunks);

    const sources: SourceReference[] = result.passages.map((p) => {
      const chunk = mergedChunks.find((c) => c.document.id === p.documentId);
      const source = chunk?.document.source;
      return {
        documentId: p.documentId,
        documentTitle: formatDocumentTitle(p.documentTitle, source),
        source,
        chunkIndex: p.chunkIndex,
        section: p.section || undefined,
        excerpt: p.text.length > 200 ? p.text.slice(0, 200) + '...' : p.text,
        score: p.score,
      };
    });

    const uniqueSources = sources.filter(
      (s, i, arr) => arr.findIndex((x) => x.excerpt === s.excerpt) === i,
    );

    return {
      answer: result.answer,
      sources: uniqueSources.slice(0, 2),
      confidence: result.confidence,
      suggestTicket: result.suggestTicket,
    };
  }
}
