import type { SessionState } from '../state/session.js';

const API_BASE: string = (window as unknown as { __API_BASE__?: string }).__API_BASE__ ?? 'http://localhost:3000';

interface ApiResponse<T> {
  readonly data?: T;
  readonly error?: string;
}

export interface LoginResponse {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly role: 'admin' | 'survivor' | 'nikita';
  };
}

export interface RoundSummary {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly startAt: number;
  readonly endAt: number;
  readonly state: 'scheduled' | 'active' | 'finished';
  readonly totalScore: number;
  readonly winner: string | null;
}

export interface RoundDetails extends RoundSummary {
  readonly you?: {
    readonly tapCount: number;
    readonly score: number;
  };
}

export interface TapInfo {
  readonly userScore: number;
  readonly userTapCount: number;
  readonly totalScore: number;
  readonly roundState: 'scheduled' | 'active' | 'finished';
}

export async function login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function listRounds(session: SessionState): Promise<ApiResponse<{ rounds: RoundSummary[] }>> {
  return request<{ rounds: RoundSummary[] }>('/rounds', {
    method: 'GET',
    token: session.token,
  });
}

export async function createRound(
  session: SessionState,
  name: string,
): Promise<ApiResponse<{ round: RoundDetails }>> {
  return request<{ round: RoundDetails }>('/rounds', {
    method: 'POST',
    token: session.token,
    body: JSON.stringify({ name }),
  });
}

export async function getRound(
  session: SessionState,
  roundId: string,
): Promise<ApiResponse<{ round: RoundDetails }>> {
  return request<{ round: RoundDetails }>(`/rounds/${roundId}`, {
    method: 'GET',
    token: session.token,
  });
}

export async function tapRound(
  session: SessionState,
  roundId: string,
): Promise<ApiResponse<{ tap: TapInfo }>> {
  return request<{ tap: TapInfo }>(`/rounds/${roundId}/tap`, {
    method: 'POST',
    token: session.token,
  });
}

interface RequestOptions {
  readonly method: 'GET' | 'POST';
  readonly token?: string;
  readonly body?: string;
}

async function request<T>(path: string, options: RequestOptions): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method,
      headers: buildHeaders(options.token, options.body !== undefined),
      body: options.body,
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    if (!response.ok) {
      const message = typeof payload.message === 'string' ? payload.message : 'Request failed';
      return { error: message };
    }
    return { data: payload as unknown as T };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

function buildHeaders(token: string | undefined, hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}
