import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { successResponse } from '../../common/utils/api-response.util';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatHistoryMessage, OpenAiService } from './openai.service';
import { classifyChatIntent } from './utils/chat-intent.util';
import { rankChunks } from './utils/chunk-ranking.util';

interface SourceReference {
  documentId: string;
  documentTitle: string;
  source?: string;
  chunkIndex: number;
  excerpt: string;
  score: number;
}

function formatDocumentTitle(title: string, source?: string): string {
  if (source === 'WORKDAY') return `Workday - ${title}`;
  return title;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private openAiService: OpenAiService,
  ) {}

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

    const priorMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 12,
    });

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: dto.content,
      },
    });

    const history: ChatHistoryMessage[] = priorMessages.map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    }));

    const { answer, sources, confidence, suggestTicket } =
      await this.generateAnswer(user.companyId, dto.content, history);

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

  private buildContext(
    rankedChunks: ReturnType<typeof rankChunks>,
  ): { context: string; documentIds: string[] } {
    const documentIds = [
      ...new Set(rankedChunks.map((chunk) => chunk.document.id)),
    ];

    const context = rankedChunks
      .map(
        (chunk) =>
          `[Document ID: ${chunk.document.id} | Title: ${chunk.document.title}]\n${chunk.content}`,
      )
      .join('\n\n---\n\n');

    return { context, documentIds };
  }

  private buildSources(
    rankedChunks: ReturnType<typeof rankChunks>,
    sourceDocumentIds: string[],
  ): SourceReference[] {
    const sourceChunks =
      sourceDocumentIds.length > 0
        ? rankedChunks.filter((chunk) =>
            sourceDocumentIds.includes(chunk.document.id),
          )
        : rankedChunks.slice(0, 2);

    const sources: SourceReference[] = sourceChunks.map((chunk) => ({
      documentId: chunk.document.id,
      documentTitle: formatDocumentTitle(
        chunk.document.title,
        chunk.document.source,
      ),
      source: chunk.document.source,
      chunkIndex: chunk.chunkIndex,
      excerpt:
        chunk.content.length > 200
          ? `${chunk.content.slice(0, 200)}...`
          : chunk.content,
      score: chunk.score,
    }));

    return sources.filter(
      (source, index, all) =>
        all.findIndex((item) => item.excerpt === source.excerpt) === index,
    );
  }

  private async generateAnswer(
    companyId: string,
    question: string,
    history: ChatHistoryMessage[],
  ) {
    const intent = classifyChatIntent(question);

    if (intent === 'general') {
      const result = await this.openAiService.generateGeneralReply(
        question,
        history,
      );

      return {
        answer: result.answer,
        sources: [],
        confidence: result.confidence,
        suggestTicket: result.suggestTicket,
      };
    }

    const chunks = await this.prisma.documentChunk.findMany({
      where: { document: { companyId, status: 'READY' } },
      include: { document: { select: { id: true, title: true, source: true } } },
      orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }],
      take: 200,
    });

    const rankedChunks = rankChunks(chunks, question, 10);
    const { context, documentIds } = this.buildContext(rankedChunks);

    const result = await this.openAiService.generateDocumentAnswer(
      question,
      context,
      documentIds,
    );

    return {
      answer: result.answer,
      sources: this.buildSources(rankedChunks, result.sourceDocumentIds).slice(
        0,
        2,
      ),
      confidence: result.confidence,
      suggestTicket: result.suggestTicket,
    };
  }
}
