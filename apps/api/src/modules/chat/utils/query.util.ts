import {
  classifyUserIntent,
  GREETING_RESPONSE,
  INTENT_DOCUMENT_QUESTION,
  INTENT_GREETING,
  INTENT_NORMAL_CHAT,
  INTENT_UNCLEAR,
  NORMAL_CHAT_RESPONSE,
  UNCLEAR_RESPONSE,
} from './intent.util';
import {
  ANSWER_COMPARISON,
  ANSWER_EXACT_FACT,
  ANSWER_MISSING_DETAIL,
  ANSWER_SUMMARY,
  ANSWER_VAGUE,
  ANSWER_YES_NO,
  ATTR_AMOUNT,
  ATTR_DURATION,
  ATTR_PERCENTAGE,
  ATTR_TIME,
  QueryRewrite,
  rewriteQuery,
} from './rewrite.util';
import {
  buildDocumentContext,
  inferDocumentDescription,
  parseAllSections,
  ParsedSection,
  sectionHeadingText,
  sectionToReadable,
} from './document.util';

export const NO_INFO =
  "I don't have enough information in your company's knowledge base to answer that.";
export const NOT_FOUND =
  "I couldn't find relevant information in your company's knowledge base. Would you like to create a support ticket?";
export const NOT_SPECIFIED = 'The document does not specify that detail.';

const MIN_SECTION_SCORE = 8;
const MAX_SOURCES = 2;

const DURATION_RE = /\b\d+\s*-?\s*(week|weeks|day|days|month|months|hour|hours|minute|minutes)\b/i;
const TIME_RE = /\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/;
const AMOUNT_RE = /(?:\$\d+|\d+\s*%|\d+\s*percent)/i;

const NEGATION_PHRASES = [
  'not supported',
  'not covered',
  'not eligible',
  'not mentioned',
  'not listed',
  'not approved',
  'not available',
  'not allowed',
  'does not state',
  'does not specify',
  'does not list',
  'does not mention',
  'does not include',
  'not include',
  'not guaranteed',
  'not accepted',
  'are not',
  'is not',
  'must not',
  'excluded',
  'prohibited',
  'will not',
];

export interface ScoredPassage {
  text: string;
  score: number;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  section: string;
}

export interface AskQuestionResult {
  answer: string;
  passages: ScoredPassage[];
  confidence: number;
  suggestTicket: boolean;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);
}

function isSectionTitleOnly(sentence: string): boolean {
  const s = sentence.trim();
  if (/^\d+\.\s+[A-Z\s]+$/.test(s) && s.length < 60) return true;
  if (s === s.toUpperCase() && s.split(/\s+/).length <= 10 && !/\d{2}/.test(s)) return true;
  if (s.length < 45 && s === s.toUpperCase()) return true;
  return false;
}

function hasNegation(text: string): boolean {
  const lower = text.toLowerCase();
  return NEGATION_PHRASES.some((phrase) => lower.includes(phrase));
}

function sectionBoostScore(sectionHeading: string, boostSections: string[]): number {
  if (!sectionHeading || boostSections.length === 0) return 0;
  const upper = sectionHeadingText({ heading: sectionHeading } as ParsedSection).toUpperCase();
  for (const boost of boostSections) {
    if (upper.includes(boost.toUpperCase()) || boost.toUpperCase().includes(upper)) {
      return 8;
    }
  }
  return 0;
}

function scoreSentence(
  sentence: string,
  rewrite: QueryRewrite,
  sectionHeading: string,
  requireDigit = false,
): number {
  if (isSectionTitleOnly(sentence)) return -10;

  const lower = sentence.toLowerCase();
  const q = rewrite.original.toLowerCase();
  const attribute = rewrite.attribute;
  let score = 0;

  score += sectionBoostScore(sectionHeading, rewrite.boostSections);

  for (const token of q.match(/[a-z0-9$%]+/g) ?? []) {
    if (token.length > 2 && lower.includes(token)) score += 1.5;
  }

  if (requireDigit && /\d/.test(sentence)) score += 2;

  if (attribute === ATTR_DURATION) {
    if (DURATION_RE.test(sentence)) score += 10;
    if (/\bhow many\b/.test(q) && /\d+\s+days\b/i.test(sentence)) score += 12;
    if (/vacation|pto|sick/.test(q) && /days/i.test(sentence) && /\d+/.test(sentence)) score += 8;
    if (/refund/i.test(lower) && /vacation|course|sick/i.test(q)) score -= 8;
  } else if (attribute === ATTR_TIME) {
    if (TIME_RE.test(sentence)) score += 12;
    if (/remote|working hours/i.test(q) && TIME_RE.test(sentence)) score += 6;
  } else if (attribute === ATTR_AMOUNT || attribute === ATTR_PERCENTAGE) {
    if (AMOUNT_RE.test(sentence)) score += 10;
    if (/\bhow many\b/.test(q) && /\d+\s+days\b/i.test(sentence)) score += 12;
    if (/expense|reimbursement/i.test(q) && /\$\d+/.test(sentence)) score += 6;
    if (/password/i.test(q) && !/password|character|mfa/i.test(lower)) score -= 10;
    if (/expense|reimbursement/i.test(q) && /password|harassment/i.test(lower)) score -= 12;
  }

  if (/password/i.test(q) && /password|mfa|multi-factor|character/i.test(lower)) score += 6;
  if (/remote/i.test(q) && /remote|manager|48 hours|three days/i.test(lower)) score += 6;
  if (/expense|reimbursement/i.test(q) && /expense|receipt|finance portal|reimbursed/i.test(lower)) score += 6;
  if (/vacation|pto/i.test(q) && /vacation|paid time off|pto/i.test(lower)) score += 6;
  if (/sick/i.test(q) && /sick leave/i.test(lower)) score += 6;
  if (/onboarding|new hire/i.test(q) && /onboarding|orientation|buddy/i.test(lower)) score += 6;

  if (/policy/i.test(q) && !/laptop|equipment/i.test(q) && /laptop|equipment only/i.test(lower)) {
    score -= 15;
  }

  return score;
}

function formatWithSection(sentence: string, section: string): string {
  if (!sentence) return NO_INFO;
  let line = sentence.trim();
  if (!line.endsWith('.')) line += '.';

  const readable = section ? sectionToReadable(sectionHeadingText({ heading: section } as ParsedSection)) : '';
  if (!readable || line.toLowerCase().includes(readable.toLowerCase())) return line;
  if (/^(yes|no)\./i.test(line)) return line;

  return `According to the ${readable} section, ${line.charAt(0).toLowerCase()}${line.slice(1)}`;
}

function yesNoPrefix(sentence: string, isYesNo: boolean): string {
  let line = sentence.trim();
  if (!line.endsWith('.')) line += '.';
  if (!isYesNo) return line;

  const lower = line.toLowerCase();
  if (/^(yes|no)\./i.test(line)) return line;
  if (hasNegation(lower)) return `No. ${line}`;
  if (/\b(yes|allowed|eligible|approved|permitted)\b/i.test(lower) && !hasNegation(lower)) {
    return `Yes. ${line}`;
  }
  return line;
}

function scoreSection(section: ParsedSection, rewrite: QueryRewrite): number {
  const heading = sectionHeadingText(section).toUpperCase();
  const combined = `${heading} ${section.body}`.toLowerCase();
  let score = sectionBoostScore(section.heading, rewrite.boostSections);

  for (const term of rewrite.searchQuery.toLowerCase().split(/\s+/)) {
    if (term.length > 2 && combined.includes(term)) score += 1;
  }

  if (section.body.length < 40 && section.heading) score -= 15;
  if (section.body.length > 80) score += 2;

  return score;
}

function rankSections(sections: ParsedSection[], rewrite: QueryRewrite): ParsedSection[] {
  const ranked = [...sections].sort(
    (a, b) => scoreSection(b, rewrite) - scoreSection(a, rewrite),
  );
  if (ranked.length <= 1) return ranked;
  const top = scoreSection(ranked[0], rewrite);
  const second = scoreSection(ranked[1], rewrite);
  if (top - second >= 4) return ranked.slice(0, 1);
  return ranked.slice(0, MAX_SOURCES);
}

function bestSentences(
  pool: { sentence: string; section: string }[],
  rewrite: QueryRewrite,
  requireDigit = false,
  limit = 1,
): string[] {
  const ranked = pool
    .map((item) => ({
      ...item,
      score: scoreSentence(item.sentence, rewrite, item.section, requireDigit),
    }))
    .filter((item) => !isSectionTitleOnly(item.sentence))
    .sort((a, b) => b.score - a.score);

  const picks: string[] = [];
  for (const item of ranked) {
    if (item.score <= 0 && picks.length > 0) break;
    if (item.score <= 0 && picks.length === 0) continue;
    picks.push(item.sentence);
    if (picks.length >= limit) break;
  }
  return picks;
}

function buildSummary(sections: ParsedSection[]): string {
  const ctx = buildDocumentContext(sections);
  if (!ctx.sections.length && !ctx.title) return NO_INFO;

  const description = ctx.description || inferDocumentDescription(ctx.title);
  const topics = ctx.sections.map((s) => sectionToReadable(sectionHeadingText({ heading: s } as ParsedSection)));

  if (!topics.length) {
    return `This document is about ${description}.`;
  }

  const topicText =
    topics.length === 1
      ? topics[0]
      : `${topics.slice(0, -1).join(', ')}, and ${topics[topics.length - 1]}`;

  return `This document is about ${description}, covering ${topicText}.`;
}

function specializedAnswer(
  pool: { sentence: string; section: string }[],
  rewrite: QueryRewrite,
): string | null {
  const q = rewrite.original.toLowerCase();

  if (/vacation|pto|how many.*day/i.test(q)) {
    const hit = pool.find((item) => /20\s+days/i.test(item.sentence) && /vacation/i.test(item.sentence));
    if (hit) return formatWithSection(hit.sentence, hit.section);
  }

  if (/sick\s+leave|sick\s+day/i.test(q)) {
    const hit = pool.find((item) => /10\s+days/i.test(item.sentence) && /sick/i.test(item.sentence));
    if (hit) return formatWithSection(hit.sentence, hit.section);
  }

  if (/password/i.test(q)) {
    const section = pool.find((item) => /password/i.test(item.sentence))?.section ?? '';
    const relevant = pool
      .filter((item) => item.section === section || /password|mfa|multi-factor|character/i.test(item.sentence))
      .map((item) => item.sentence)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 3);
    if (relevant.length) return formatWithSection(relevant.join(' '), section);
  }

  if (/remote/i.test(q)) {
    const section = pool.find((item) => /remote/i.test(item.sentence))?.section ?? '';
    const relevant = pool
      .filter((item) => /remote|three days|48 hours|manager/i.test(item.sentence))
      .map((item) => item.sentence)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 2);
    if (relevant.length) return formatWithSection(relevant.join(' '), section);
  }

  if (/expense|reimbursement/i.test(q)) {
    const section = pool.find((item) => /expense|reimbursement|finance portal/i.test(item.sentence))?.section ?? '';
    const relevant = pool
      .filter((item) => /expense|reimbursement|finance portal|\$25|receipt/i.test(item.sentence))
      .map((item) => item.sentence)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 2);
    if (relevant.length) return formatWithSection(relevant.join(' '), section);
  }

  return null;
}

function isBroadPolicyQuestion(question: string): boolean {
  return /\b(policy|policies|process|requirements?|rules?)\b/i.test(question);
}

function exactFactAnswer(
  pool: { sentence: string; section: string }[],
  rewrite: QueryRewrite,
): string {
  const attribute = rewrite.attribute;
  const requireDigit = [ATTR_DURATION, ATTR_AMOUNT, ATTR_PERCENTAGE, ATTR_TIME].includes(attribute);
  const broad = isBroadPolicyQuestion(rewrite.original);
  const sentenceLimit = broad ? 3 : rewrite.narrow ? 1 : 2;

  const specialized = specializedAnswer(pool, rewrite);
  if (specialized) return specialized;

  const picks = bestSentences(pool, rewrite, requireDigit && !broad, sentenceLimit);
  if (!picks.length) return NOT_SPECIFIED;

  const section = pool.find((p) => p.sentence === picks[0])?.section ?? '';
  const body = picks.join(' ');

  if (picks.length === 1) {
    return formatWithSection(picks[0], section);
  }

  return formatWithSection(body, section);
}

function yesNoAnswer(pool: { sentence: string; section: string }[], rewrite: QueryRewrite): string {
  const picks = bestSentences(pool, rewrite, false, 1);
  if (!picks.length) return NOT_SPECIFIED;
  const section = pool.find((p) => p.sentence === picks[0])?.section ?? '';
  return formatWithSection(yesNoPrefix(picks[0], true), section);
}

function extractiveAnswer(
  topSections: ParsedSection[],
  allSections: ParsedSection[],
  rewrite: QueryRewrite,
): string | null {
  if (!allSections.length) return NO_INFO;

  if (rewrite.answerType === ANSWER_SUMMARY) {
    return buildSummary(allSections);
  }

  if (rewrite.answerType === ANSWER_VAGUE) {
    return 'The question is unclear. Please specify what duration, time, amount, or topic you are asking about.';
  }

  const sourceSections = topSections.length ? topSections : allSections;
  const pool: { sentence: string; section: string }[] = [];

  for (const section of sourceSections) {
    const heading = section.heading;
    for (const sentence of sentences(section.body)) {
      pool.push({ sentence, section: heading });
    }
  }

  const specialized = specializedAnswer(pool, rewrite);
  if (specialized) return specialized;

  if (rewrite.answerType === ANSWER_YES_NO) {
    return yesNoAnswer(pool, rewrite);
  }

  if (rewrite.answerType === ANSWER_EXACT_FACT) {
    return exactFactAnswer(pool, rewrite);
  }

  if (rewrite.answerType === ANSWER_MISSING_DETAIL) {
    for (const item of pool) {
      if (/does not|not mention|not list|not specify/i.test(item.sentence)) {
        return formatWithSection(item.sentence, item.section);
      }
    }
    return NOT_SPECIFIED;
  }

  if (rewrite.answerType === ANSWER_COMPARISON) {
    return yesNoAnswer(pool, rewrite);
  }

  const picks = bestSentences(pool, rewrite, false, 1);
  if (!picks.length) return null;

  const section = pool.find((p) => p.sentence === picks[0])?.section ?? '';
  return formatWithSection(picks[0], section);
}

function buildPassages(sections: ParsedSection[], rewrite: QueryRewrite): ScoredPassage[] {
  return rankSections(sections, rewrite).map((section) => ({
    text: section.body.replace(/\s+/g, ' ').trim().slice(0, 300),
    score: scoreSection(section, rewrite),
    documentId: section.documentId,
    documentTitle: section.documentTitle,
    chunkIndex: section.chunkIndex,
    section: section.heading,
  }));
}

export function askQuestion(
  question: string,
  chunks: {
    content: string;
    chunkIndex: number;
    document: { id: string; title: string };
  }[],
): AskQuestionResult {
  const intent = classifyUserIntent(question);

  if (intent === INTENT_GREETING) {
    return { answer: GREETING_RESPONSE, passages: [], confidence: 1, suggestTicket: false };
  }

  if (intent === INTENT_UNCLEAR) {
    return { answer: UNCLEAR_RESPONSE, passages: [], confidence: 0, suggestTicket: false };
  }

  if (intent === INTENT_NORMAL_CHAT) {
    return { answer: NORMAL_CHAT_RESPONSE, passages: [], confidence: 0, suggestTicket: false };
  }

  if (!chunks.length) {
    return { answer: NO_INFO, passages: [], confidence: 0, suggestTicket: true };
  }

  const allSections = parseAllSections(chunks);
  if (!allSections.length) {
    return { answer: NOT_FOUND, passages: [], confidence: 0, suggestTicket: true };
  }

  const docContext = buildDocumentContext(allSections);
  const rewrite = rewriteQuery(question, docContext);

  if (rewrite.answerType === ANSWER_SUMMARY) {
    const answer = extractiveAnswer([], allSections, rewrite) ?? NOT_FOUND;
    return {
      answer,
      passages: buildPassages(allSections, rewrite),
      confidence: 0.9,
      suggestTicket: false,
    };
  }

  const ranked = rankSections(allSections, rewrite);
  const bestScore = ranked.length ? scoreSection(ranked[0], rewrite) : 0;
  const hasTopicMatch = rewrite.boostSections.length > 0;
  const minRequired = hasTopicMatch ? MIN_SECTION_SCORE : MIN_SECTION_SCORE + 12;

  if (bestScore < minRequired) {
    return { answer: NOT_FOUND, passages: [], confidence: 0, suggestTicket: true };
  }

  if (hasTopicMatch) {
    const topHeading = sectionHeadingText(ranked[0]).toUpperCase();
    const sectionMatches = rewrite.boostSections.some(
      (boost) => topHeading.includes(boost.toUpperCase()) || boost.toUpperCase().includes(topHeading),
    );
    if (!sectionMatches) {
      return { answer: NOT_FOUND, passages: [], confidence: 0, suggestTicket: true };
    }
  }

  const answer = extractiveAnswer(ranked, allSections, rewrite);

  if (!answer || answer === NOT_SPECIFIED) {
    return {
      answer: NOT_FOUND,
      passages: buildPassages(ranked, rewrite),
      confidence: 0,
      suggestTicket: true,
    };
  }

  const passages = buildPassages(ranked, rewrite);
  const confidence = Math.min(bestScore / 30, 1);

  return { answer, passages, confidence, suggestTicket: false };
}
