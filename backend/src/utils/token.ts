import jwt from 'jsonwebtoken';
import { appConfig } from '../env.js';

export interface AuthTokenPayload {
  userId: number;
}

export function createAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, appConfig.jwtSecret, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, appConfig.jwtSecret) as AuthTokenPayload;
}
