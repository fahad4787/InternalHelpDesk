const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'ymail.com',
]);

export const TEAMS_WORK_ACCOUNT_MESSAGE =
  'Teams and chats require a Microsoft 365 work or school account with a Teams license. Personal Microsoft accounts (for example Gmail, Outlook.com, or teams.live.com) can sign in, but Microsoft Graph cannot return their teams or chats.';

export function isPersonalMicrosoftAccount(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const domain = email.trim().split('@')[1]?.toLowerCase();
  return Boolean(domain && PERSONAL_EMAIL_DOMAINS.has(domain));
}

export function isTeamsGraphUnsupportedError(error: unknown): boolean {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';

  const normalized = message.toLowerCase();
  return (
    normalized.includes('no authorization information present') ||
    normalized.includes('personal microsoft account') ||
    normalized.includes('work or school') ||
    normalized.includes('teams.live.com')
  );
}
