export type ChatIntent = 'document' | 'general';

const DOCUMENT_SIGNALS = [
  /\b(policy|policies|handbook|document|documents|knowledge base|workday)\b/i,
  /\b(vacation|pto|paid time off|leave|sick day|sick leave|benefits|insurance|enrollment)\b/i,
  /\b(expense|reimbursement|payroll|salary|compensation|bonus)\b/i,
  /\b(password|remote work|work from home|wfh|onboarding|probation|attendance)\b/i,
  /\b(hr|human resources|it support|finance team|admin team)\b/i,
  /\b(company rule|employee guide|internal guide|sop|procedure|guideline)\b/i,
  /\bhow many (days|hours|weeks)\b/i,
  /\bwhat is (the|our) .*(policy|process|procedure|rule)\b/i,
  /\baccording to\b/i,
  /\bin the (handbook|document|guide|policy)\b/i,
  /\bdo we have\b/i,
  /\bcan i (take|request|claim|submit)\b/i,
];

export function classifyChatIntent(message: string): ChatIntent {
  const trimmed = message.trim();
  if (!trimmed) {
    return 'general';
  }

  if (DOCUMENT_SIGNALS.some((pattern) => pattern.test(trimmed))) {
    return 'document';
  }

  return 'general';
}
