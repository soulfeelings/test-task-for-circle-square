import * as crypto from 'node:crypto';
import type { AuthTokenPayload } from '../domain/models.js';

export interface PasswordHashResult {
  readonly hash: string;
  readonly salt: string;
}

export function hashPassword(password: string, salt?: string): PasswordHashResult {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64);
  return {
    salt: actualSalt,
    hash: derived.toString('hex'),
  };
}

function base64Url(input: string | ArrayBuffer | Uint8Array): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function createToken(payload: AuthTokenPayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64Url(JSON.stringify(header));
  const payloadEncoded = base64Url(JSON.stringify(payload));
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${base64Url(signature)}`;
}

export function verifyToken(token: string, secret: string): AuthTokenPayload | null {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    return null;
  }
  const data = `${header}.${payload}`;
  const expectedSignature = base64Url(crypto.createHmac('sha256', secret).update(data).digest());
  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')) as AuthTokenPayload;
    return parsed;
  } catch (error) {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
