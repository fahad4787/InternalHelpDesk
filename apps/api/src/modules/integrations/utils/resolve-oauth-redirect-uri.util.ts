import { ConfigService } from '@nestjs/config';

interface ResolveOAuthRedirectUriOptions {
  envKey: string;
  callbackPath: string;
}

export function resolveOAuthRedirectUri(
  configService: ConfigService,
  options: ResolveOAuthRedirectUriOptions,
): string {
  const explicit = configService.get<string>(options.envKey)?.trim();
  if (explicit) {
    return explicit;
  }

  const publicApiUrl = configService.get<string>('PUBLIC_API_URL')?.trim();
  if (publicApiUrl) {
    return `${publicApiUrl.replace(/\/$/, '')}${options.callbackPath}`;
  }

  const port = configService.get<number>('PORT', 3001);
  return `http://127.0.0.1:${port}${options.callbackPath}`;
}
