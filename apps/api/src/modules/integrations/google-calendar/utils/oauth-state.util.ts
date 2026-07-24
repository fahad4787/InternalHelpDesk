import { createHmac, timingSafeEqual } from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

export function createOAuthState(userId: string, secret: string): string {
  const exp = Date.now() + STATE_TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyOAuthState(state: string, secret: string): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const lastDot = decoded.lastIndexOf('.');
    if (lastDot === -1) return null;

    const sig = decoded.slice(lastDot + 1);
    const payload = decoded.slice(0, lastDot);
    const dotIndex = payload.indexOf('.');
    if (dotIndex === -1) return null;

    const userId = payload.slice(0, dotIndex);
    const exp = Number(payload.slice(dotIndex + 1));
    if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;

    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    return userId;
  } catch {
    return null;
  }
}

/** Signed OAuth state that also carries opaque data (e.g. PKCE code_verifier). */
export function createOAuthStateWithData(
  userId: string,
  secret: string,
  data: string,
): string {
  const exp = Date.now() + STATE_TTL_MS;
  const encodedData = Buffer.from(data, 'utf8').toString('base64url');
  const payload = `${userId}.${exp}.${encodedData}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyOAuthStateWithData(
  state: string,
  secret: string,
): { userId: string; data: string } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const lastDot = decoded.lastIndexOf('.');
    if (lastDot === -1) return null;

    const sig = decoded.slice(lastDot + 1);
    const payload = decoded.slice(0, lastDot);
    const parts = payload.split('.');
    if (parts.length !== 3) return null;

    const [userId, expRaw, encodedData] = parts;
    const exp = Number(expRaw);
    if (!userId || !Number.isFinite(exp) || Date.now() > exp || !encodedData) {
      return null;
    }

    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    return {
      userId,
      data: Buffer.from(encodedData, 'base64url').toString('utf8'),
    };
  } catch {
    return null;
  }
}
