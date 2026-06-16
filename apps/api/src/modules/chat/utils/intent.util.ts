export const INTENT_GREETING = 'greeting';
export const INTENT_NORMAL_CHAT = 'normal_chat';
export const INTENT_DOCUMENT_QUESTION = 'document_question';
export const INTENT_UNCLEAR = 'unclear';

export const GREETING_RESPONSE =
  "Hello! I'm your company AI assistant. Ask me anything about your uploaded policies and documents.";

export const UNCLEAR_RESPONSE =
  "I'm not sure what you mean. Try asking about HR policies, IT security, remote work, expenses, or other topics in your knowledge base.";

export const NORMAL_CHAT_RESPONSE =
  "I can answer questions based on your company's uploaded documents. Try asking about vacation policy, password requirements, remote work, or expenses.";

const GREETING_RE =
  /^(?:hello|hi|hey|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening)|hi\s+there|hello\s+there)[\s!.?,]*$/i;

const NORMAL_CHAT_RE =
  /(?:^how\s+are\s+you|^how'?re\s+you|^what'?s\s+up|^thanks?(?:\s+you)?$|^thank\s+you$|^goodbye$|^bye(?:\s+bye)?$|^see\s+you$|\bexplain\s+rag\b|\bwho\s+is\s+the\s+president\b|\bwhat(?:'s|\s+is)\s+the\s+weather\b|\bcapital\s+of\b)/i;

const DOCUMENT_TOPIC_RE =
  /\b(?:vacation|pto|paid\s+time|time\s+off|sick\s+leave|password|mfa|authentication|remote\s+work|work\s+from\s+home|wfh|expense|reimbursement|onboarding|benefits|insurance|laptop|equipment|harassment|conduct|ethics|handbook|policy|policies|training|leave|remote|portal|helpdesk|security|department|ticket)\b/i;

const QUESTION_RE =
  /\b(?:what|how|when|where|which|who|why|is|are|can|could|does|do|will|should|tell\s+me|summarize|summarise|explain|describe|list|show)\b/i;

const SUMMARY_RE =
  /\b(?:tell\s+me\s+about\s+(?:the\s+)?(?:uploaded\s+)?doc(?:ument)?|summarize\s+(?:the\s+)?(?:uploaded\s+)?doc(?:ument)?|what(?:'s|\s+is)\s+this\s+doc(?:ument)?\s+about|summary\s+of\s+(?:the\s+)?(?:uploaded\s+)?doc(?:ument)?|overview\s+of\s+(?:the\s+)?(?:uploaded\s+)?doc(?:ument)?)\b/i;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyUserIntent(message: string): string {
  const raw = message.trim();
  if (!raw) return INTENT_UNCLEAR;

  const q = normalize(raw);
  const words = q.split(/\s+/);

  if (GREETING_RE.test(q)) return INTENT_GREETING;
  if (SUMMARY_RE.test(q)) return INTENT_DOCUMENT_QUESTION;

  if (DOCUMENT_TOPIC_RE.test(q) && (QUESTION_RE.test(q) || words.length >= 2)) {
    return INTENT_DOCUMENT_QUESTION;
  }

  if (NORMAL_CHAT_RE.test(q)) return INTENT_NORMAL_CHAT;

  if (QUESTION_RE.test(q) && words.length >= 3) {
    return INTENT_DOCUMENT_QUESTION;
  }

  if (words.length <= 2 && !DOCUMENT_TOPIC_RE.test(q)) {
    if (['help', 'what', 'why', 'how', 'when', 'where', 'who'].includes(q)) {
      return INTENT_UNCLEAR;
    }
  }

  if (QUESTION_RE.test(q) && words.length >= 2) {
    return INTENT_DOCUMENT_QUESTION;
  }

  if (words.length >= 3) {
    return INTENT_DOCUMENT_QUESTION;
  }

  return INTENT_UNCLEAR;
}
