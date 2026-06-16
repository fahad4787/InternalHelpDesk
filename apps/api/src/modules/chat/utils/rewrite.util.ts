export const ANSWER_SUMMARY = 'summary';
export const ANSWER_EXACT_FACT = 'exact_fact';
export const ANSWER_MISSING_DETAIL = 'missing_detail';
export const ANSWER_YES_NO = 'yes_no';
export const ANSWER_COMPARISON = 'comparison_or_policy_relation';
export const ANSWER_VAGUE = 'vague';

export const ATTR_DURATION = 'duration';
export const ATTR_TIME = 'time';
export const ATTR_AMOUNT = 'amount';
export const ATTR_PERCENTAGE = 'percentage';
export const ATTR_YES_NO = 'yes_no';
export const ATTR_MISSING_DETAIL = 'missing_detail';
export const ATTR_GENERAL = 'general';

const SUMMARY_PHRASES = [
  'tell me about the doc',
  'tell me about this doc',
  'summarize document',
  'summarize the document',
  'what is this document about',
  "what's this document about",
  'summary of the document',
  'overview of the document',
];

const COMPARISON_PHRASES = ['part of', 'included in', 'handled under', 'covered under', 'belong to'];

const YES_NO_STARTERS = ['will ', 'can ', 'is ', 'are ', 'does ', 'do ', 'should '];

export interface DocContext {
  title: string;
  description: string;
  sections: string[];
}

export interface QueryRewrite {
  original: string;
  searchQuery: string;
  answerType: string;
  attribute: string;
  boostSections: string[];
  narrow: boolean;
}

const PATTERN_REWRITES: {
  pattern: RegExp;
  terms: string[];
  sections: string[];
}[] = [
  {
    pattern: /vacation|pto|paid\s+time\s+off|time\s+off|holiday/i,
    terms: ['paid vacation', '20 days', 'vacation requests', 'HR portal', 'roll over'],
    sections: ['PAID TIME OFF AND VACATION'],
  },
  {
    pattern: /password|mfa|authentication|credentials|multi-factor/i,
    terms: ['12 characters', '90 days', 'multi-factor', 'password resets', 'IT helpdesk'],
    sections: ['PASSWORD AND IT SECURITY'],
  },
  {
    pattern: /remote|work\s+from\s+home|wfh/i,
    terms: ['remote work', 'three days', 'manager', '48 hours', 'HR approval'],
    sections: ['WORKING HOURS AND REMOTE WORK'],
  },
  {
    pattern: /expense|reimbursement|receipt|finance\s+portal/i,
    terms: ['30 days', 'receipts', '$25', 'Finance portal', 'business travel'],
    sections: ['EXPENSE REIMBURSEMENT'],
  },
  {
    pattern: /sick\s+leave|sick\s+day|medical\s+leave|illness/i,
    terms: ['10 days', 'paid sick leave', 'doctor', 'absence'],
    sections: ['SICK LEAVE'],
  },
  {
    pattern: /onboarding|new\s+hire|orientation|buddy/i,
    terms: ['welcome email', 'orientation', 'IT setup', 'buddy', 'compliance training'],
    sections: ['ONBOARDING FOR NEW HIRES'],
  },
  {
    pattern: /benefits|insurance|enrollment|medical\s+plan/i,
    terms: ['health insurance', 'medical plans', 'dental', 'vision', '30 days'],
    sections: ['BENEFITS ENROLLMENT'],
  },
  {
    pattern: /laptop|equipment|device|computer/i,
    terms: ['company laptops', 'return equipment', 'IT approval', 'lost or stolen'],
    sections: ['EQUIPMENT AND LAPTOP POLICY'],
  },
  {
    pattern: /harassment|discrimination|conduct|ethics|hotline/i,
    terms: ['zero-tolerance', 'ethics hotline', 'retaliation', 'HR'],
    sections: ['CODE OF CONDUCT'],
  },
  {
    pattern: /working\s+hours|office\s+hours/i,
    terms: ['Monday through Friday', '9:00 AM', '5:00 PM'],
    sections: ['WORKING HOURS AND REMOTE WORK'],
  },
];

const SECTION_BOOST_RULES: { keywords: string[]; section: string }[] = [
  { keywords: ['vacation', 'pto', 'paid time off', 'holiday'], section: 'PAID TIME OFF AND VACATION' },
  { keywords: ['password', 'mfa', 'authentication', 'security', 'reset'], section: 'PASSWORD AND IT SECURITY' },
  { keywords: ['remote', 'work from home', 'wfh'], section: 'WORKING HOURS AND REMOTE WORK' },
  { keywords: ['expense', 'reimbursement', 'receipt', 'finance'], section: 'EXPENSE REIMBURSEMENT' },
  { keywords: ['sick', 'illness', 'medical leave'], section: 'SICK LEAVE' },
  { keywords: ['onboarding', 'new hire', 'orientation', 'buddy'], section: 'ONBOARDING FOR NEW HIRES' },
  { keywords: ['benefits', 'insurance', 'enrollment'], section: 'BENEFITS ENROLLMENT' },
  { keywords: ['laptop', 'equipment', 'device'], section: 'EQUIPMENT AND LAPTOP POLICY' },
  { keywords: ['harassment', 'conduct', 'ethics'], section: 'CODE OF CONDUCT' },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function detectAttribute(question: string, answerType: string): string {
  const q = normalize(question);

  if (answerType === ANSWER_VAGUE) return ATTR_GENERAL;
  if (answerType === ANSWER_YES_NO) return ATTR_YES_NO;
  if (answerType === ANSWER_MISSING_DETAIL) return ATTR_MISSING_DETAIL;

  if (/\bhow long\b/.test(q) || /\b(duration|length)\b/.test(q)) return ATTR_DURATION;
  if (/\bwhat time\b/.test(q)) return ATTR_TIME;
  if (/\bhow much\b/.test(q) || /\b(price|cost|fee|deposit|amount)\b/.test(q)) {
    return /%|percent/.test(q) ? ATTR_PERCENTAGE : ATTR_AMOUNT;
  }
  if (/\bhow many\b/.test(q)) return ATTR_AMOUNT;
  if (/\b(score|percentage|percent)\b/.test(q)) return ATTR_PERCENTAGE;

  return ATTR_GENERAL;
}

export function classifyAnswerType(question: string): string {
  const q = normalize(question);
  const words = q.split(/\s+/);

  if (words.length <= 2 && ['long', 'how long'].includes(q)) return ANSWER_VAGUE;
  if (SUMMARY_PHRASES.some((p) => q.includes(p))) return ANSWER_SUMMARY;
  if (COMPARISON_PHRASES.some((p) => q.includes(p))) return ANSWER_COMPARISON;

  if (/\b(how much|how many|how long|when|what time)\b/.test(q)) return ANSWER_EXACT_FACT;

  if (
    /\bwhat is\b/.test(q) &&
    /\b(price|cost|amount|rate|fee|duration|length|time|policy|process)\b/.test(q)
  ) {
    return ANSWER_EXACT_FACT;
  }

  if (YES_NO_STARTERS.some((s) => q.startsWith(s)) || /^(will|can|is|are|does|do|should)\b/.test(q)) {
    return ANSWER_YES_NO;
  }

  if (/not mention|not specified|not stated|not list/.test(q)) return ANSWER_MISSING_DETAIL;

  return ANSWER_EXACT_FACT;
}

export function isNarrowQuestion(question: string, answerType: string): boolean {
  if ([ANSWER_EXACT_FACT, ANSWER_YES_NO, ANSWER_COMPARISON, ANSWER_VAGUE].includes(answerType)) {
    return true;
  }
  return /\b(when|who|which|what time)\b/.test(normalize(question));
}

function patternExpansions(question: string): { terms: string[]; sections: string[] } {
  const q = normalize(question);
  const terms: string[] = [];
  const sections: string[] = [];

  for (const { pattern, terms: t, sections: s } of PATTERN_REWRITES) {
    if (pattern.test(q)) {
      terms.push(...t);
      sections.push(...s);
    }
  }

  return { terms, sections };
}

function sectionBoostsFromQuery(question: string): string[] {
  const q = normalize(question);
  const boosts: string[] = [];
  for (const { keywords, section } of SECTION_BOOST_RULES) {
    if (keywords.some((kw) => q.includes(kw))) {
      boosts.push(section);
    }
  }
  return boosts;
}

export function rewriteQuery(question: string, docContext: DocContext = { title: '', description: '', sections: [] }): QueryRewrite {
  const answerType = classifyAnswerType(question);
  const attribute = detectAttribute(question, answerType);
  const searchParts: string[] = [question.trim()];

  const { terms: patternTerms, sections: patternSections } = patternExpansions(question);
  searchParts.push(...patternTerms);

  const boostSections = [...new Set([...patternSections, ...sectionBoostsFromQuery(question)])];

  if (docContext.title) searchParts.push(docContext.title);
  searchParts.push(...docContext.sections);

  if (answerType === ANSWER_SUMMARY) {
    searchParts.push(...docContext.sections);
    if (docContext.title) searchParts.push(docContext.title);
  }

  const seen = new Set<string>();
  const uniqueParts = searchParts.filter((part) => {
    const key = part.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    original: question.trim(),
    searchQuery: uniqueParts.join(' '),
    answerType,
    attribute,
    boostSections,
    narrow: isNarrowQuestion(question, answerType),
  };
}
