import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface OpenAiAnswerResult {
  answer: string;
  suggestTicket: boolean;
  confidence: number;
  sourceDocumentIds: string[];
}

const SYSTEM_PROMPT = `You are an internal helpdesk AI assistant for a company.
Answer employee questions using ONLY the provided company documents.
If the documents do not contain enough information, say you could not find that in the knowledge base and suggest creating a support ticket.
For greetings or small talk, reply briefly and offer to help with company policies and internal documents.
Do not invent policies, numbers, or procedures.

Respond with valid JSON only:
{
  "answer": "string",
  "suggestTicket": boolean,
  "confidence": number between 0 and 1,
  "sourceDocumentIds": ["document-id", ...]
}`;

@Injectable()
export class OpenAiService {
  private client: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  private getModel(): string {
    return this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async generateAnswer(
    question: string,
    context: string,
    documentIds: string[],
  ): Promise<OpenAiAnswerResult> {
    if (!context.trim()) {
      return {
        answer:
          'I could not find any company documents to search. Please upload knowledge base documents or create a support ticket.',
        suggestTicket: true,
        confidence: 0,
        sourceDocumentIds: [],
      };
    }

    try {
      const response = await this.getClient().chat.completions.create({
        model: this.getModel(),
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Available document IDs: ${documentIds.join(', ')}

Company documents:
${context}

Employee question:
${question}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new InternalServerErrorException('OpenAI returned an empty response');
      }

      const parsed = JSON.parse(content) as Partial<OpenAiAnswerResult>;
      const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
      if (!answer) {
        throw new InternalServerErrorException('OpenAI returned an invalid answer');
      }

      const sourceDocumentIds = Array.isArray(parsed.sourceDocumentIds)
        ? parsed.sourceDocumentIds.filter(
            (id): id is string =>
              typeof id === 'string' && documentIds.includes(id),
          )
        : [];

      const confidence =
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5;

      return {
        answer,
        suggestTicket: parsed.suggestTicket === true,
        confidence,
        sourceDocumentIds,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'OpenAI request failed';
      throw new InternalServerErrorException(message);
    }
  }
}
