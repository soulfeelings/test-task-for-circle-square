import type {
  CreateRoundResponse,
  LoginResponse,
  MeResponse,
  RoundListResponse,
  TapResponse
} from './types';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    credentials: 'include'
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      if (data && typeof data === 'object' && 'message' in data) {
        message = String((data as { message?: unknown }).message ?? message);
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message || 'Неизвестная ошибка');
  }

  return (await response.json()) as T;
}

export function login(username: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export function logout() {
  return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return request<MeResponse>('/api/auth/me');
}

export function fetchRounds() {
  return request<RoundListResponse>('/api/rounds');
}

export function createRound(title?: string) {
  return request<CreateRoundResponse>('/api/rounds', {
    method: 'POST',
    body: JSON.stringify({ title })
  });
}

export function fetchRound(roundId: number) {
  return request<RoundDetailResponse>(`/api/rounds/${roundId}`);
}

export function tapRound(roundId: number) {
  return request<TapResponse>(`/api/rounds/${roundId}/tap`, {
    method: 'POST'
  });
}
