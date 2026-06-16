import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus, DocumentSource } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/types/api-response.type';
import { paginate, successResponse } from '../../common/utils/api-response.util';
import { chunkText, estimateTokenCount } from './utils/chunk-text.util';
import { parseDocumentText } from './utils/parse-document.util';

@Injectable()
export class KnowledgeBaseService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.uploadDir = configService.get('UPLOAD_DIR', './uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(user: AuthenticatedUser, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      companyId: user.companyId,
      ...(query.search && {
        title: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { chunks: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    const result = paginate(documents, total, page, limit);
    return successResponse(result.data, 'Documents retrieved', result.meta);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { chunks: true } },
      },
    });

    if (!document) throw new NotFoundException('Document not found');
    return successResponse(document);
  }

  async getPreview(user: AuthenticatedUser, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { chunks: true } },
      },
    });

    if (!document) throw new NotFoundException('Document not found');

    let content = '';
    if (existsSync(document.filePath)) {
      content = await parseDocumentText(document.filePath, document.mimeType);
    } else {
      const chunks = await this.prisma.documentChunk.findMany({
        where: { documentId: id },
        orderBy: { chunkIndex: 'asc' },
        select: { content: true },
      });
      content = chunks.map((c) => c.content).join('\n\n');
    }

    return successResponse({ ...document, content });
  }

  async upload(
    user: AuthenticatedUser,
    file: Express.Multer.File,
    title?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const document = await this.prisma.document.create({
      data: {
        title: title || file.originalname,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: DocumentStatus.PROCESSING,
        companyId: user.companyId,
        uploadedById: user.id,
      },
    });

    try {
      await this.processDocument(document.id);
    } catch {
      await this.prisma.document.update({
        where: { id: document.id },
        data: { status: DocumentStatus.FAILED },
      });
    }

    const updated = await this.prisma.document.findUnique({
      where: { id: document.id },
      include: { _count: { select: { chunks: true } } },
    });

    return successResponse(updated, 'Document uploaded');
  }

  async processTextContent(documentId: string, text: string) {
    const chunks = chunkText(text);

    await this.prisma.$transaction(async (tx) => {
      await tx.documentChunk.deleteMany({ where: { documentId } });

      if (chunks.length > 0) {
        await tx.documentChunk.createMany({
          data: chunks.map((content, index) => ({
            documentId,
            content,
            chunkIndex: index,
            tokenCount: estimateTokenCount(content),
          })),
        });
      }

      await tx.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.READY },
      });
    });

    return { documentId, chunkCount: chunks.length };
  }

  async syncExternalDocument(params: {
    companyId: string;
    uploadedById: string;
    title: string;
    content: string;
    source: DocumentSource;
    externalId: string;
    sourceUrl?: string;
    category?: string;
    tags?: string[];
  }) {
    const workdayDir = join(this.uploadDir, 'workday', params.companyId);
    if (!existsSync(workdayDir)) {
      mkdirSync(workdayDir, { recursive: true });
    }

    const fileName = `${params.externalId}.txt`;
    const filePath = join(workdayDir, fileName);
    await writeFile(filePath, params.content, 'utf8');
    const fileSize = Buffer.byteLength(params.content, 'utf8');
    const now = new Date();

    const existing = await this.prisma.document.findFirst({
      where: {
        companyId: params.companyId,
        source: params.source,
        externalId: params.externalId,
      },
    });

    if (existing) {
      await this.prisma.document.update({
        where: { id: existing.id },
        data: {
          title: params.title,
          fileName,
          filePath,
          mimeType: 'text/plain',
          fileSize,
          status: DocumentStatus.PROCESSING,
          sourceUrl: params.sourceUrl,
          category: params.category,
          tags: params.tags ?? [],
          lastSyncedAt: now,
        },
      });

      await this.processTextContent(existing.id, params.content);
      return { documentId: existing.id, created: false };
    }

    const document = await this.prisma.document.create({
      data: {
        title: params.title,
        fileName,
        filePath,
        mimeType: 'text/plain',
        fileSize,
        status: DocumentStatus.PROCESSING,
        source: params.source,
        externalId: params.externalId,
        sourceUrl: params.sourceUrl,
        category: params.category,
        tags: params.tags ?? [],
        lastSyncedAt: now,
        companyId: params.companyId,
        uploadedById: params.uploadedById,
      },
    });

    await this.processTextContent(document.id, params.content);
    return { documentId: document.id, created: true };
  }

  async processDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Document not found');

    const text = await parseDocumentText(document.filePath, document.mimeType);
    const chunks = chunkText(text);

    await this.prisma.$transaction(async (tx) => {
      await tx.documentChunk.deleteMany({ where: { documentId } });

      if (chunks.length > 0) {
        await tx.documentChunk.createMany({
          data: chunks.map((content, index) => ({
            documentId,
            content,
            chunkIndex: index,
            tokenCount: estimateTokenCount(content),
          })),
        });
      }

      await tx.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.READY },
      });
    });

    return successResponse({ documentId, chunkCount: chunks.length });
  }

  async updateTitle(user: AuthenticatedUser, id: string, title: string) {
    const existing = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw new NotFoundException('Document not found');

    const document = await this.prisma.document.update({
      where: { id },
      data: { title },
    });

    return successResponse(document, 'Document updated');
  }

  async remove(user: AuthenticatedUser, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!document) throw new NotFoundException('Document not found');

    await this.deleteDocumentFiles(document);
    await this.prisma.document.delete({ where: { id } });
    return successResponse(null, 'Document deleted');
  }

  async removeBySource(companyId: string, source: DocumentSource): Promise<number> {
    const documents = await this.prisma.document.findMany({
      where: { companyId, source },
    });

    for (const document of documents) {
      await this.deleteDocumentFiles(document);
    }

    const result = await this.prisma.document.deleteMany({
      where: { companyId, source },
    });

    return result.count;
  }

  private async deleteDocumentFiles(document: { filePath: string }) {
    if (existsSync(document.filePath)) {
      await unlink(document.filePath).catch(() => undefined);
    }
  }

  getUploadPath(companyId: string, originalName: string): string {
    const ext = extname(originalName);
    const filename = `${companyId}-${Date.now()}${ext}`;
    return join(this.uploadDir, filename);
  }
}
