export type UserRole = 'admin' | 'survivor' | 'nikita';

export interface User {
  readonly id: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly passwordSalt: string;
  readonly role: UserRole;
  readonly createdAt: number;
}

export interface RoundParticipant {
  readonly userId: string;
  readonly roundId: string;
  readonly tapCount: number;
  readonly score: number;
  readonly updatedAt: number;
}

export interface Round {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly startAt: number;
  readonly endAt: number;
  readonly totalScore: number;
  readonly winnerUserId: string | null;
}

export type RoundState = 'scheduled' | 'active' | 'finished';

export interface RoundWithParticipants extends Round {
  readonly participants: RoundParticipant[];
}

export interface AuthTokenPayload {
  readonly userId: string;
  readonly role: UserRole;
  readonly username: string;
  readonly issuedAt: number;
}

export interface LoginResult {
  readonly token: string;
  readonly user: User;
}

export interface TapResult {
  readonly userScore: number;
  readonly userTapCount: number;
  readonly totalScore: number;
  readonly roundState: RoundState;
}

export interface RoundView {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly startAt: number;
  readonly endAt: number;
  readonly state: RoundState;
  readonly totalScore: number;
  readonly winner: string | null;
  readonly you?: {
    readonly tapCount: number;
    readonly score: number;
  };
}
