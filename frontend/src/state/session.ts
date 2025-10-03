export type UserRole = 'admin' | 'survivor' | 'nikita';

export interface SessionUser {
  readonly id: string;
  readonly username: string;
  readonly role: UserRole;
}

export interface SessionState {
  readonly token: string;
  readonly user: SessionUser;
}

const STORAGE_KEY = 'last-of-guss-session';

export function loadSession(): SessionState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (parsed && parsed.token && parsed.user) {
      return parsed;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function saveSession(session: SessionState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
