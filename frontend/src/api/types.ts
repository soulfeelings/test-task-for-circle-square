export type UserRole = 'survivor' | 'admin' | 'nikita';

export interface UserDto {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  user: UserDto;
}

export interface MeResponse {
  user: UserDto;
}

export type RoundStatus = 'scheduled' | 'active' | 'completed';

export interface RoundSummary {
  id: number;
  title: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  status: RoundStatus;
}

export interface RoundListResponse {
  rounds: RoundSummary[];
}

export interface CreateRoundResponse {
  round: {
    id: number;
    title: string | null;
    startsAt: string;
    endsAt: string;
    createdAt: string;
  };
}

export interface LeaderboardRow {
  userId: number;
  username: string;
  taps: number;
  points: number;
}

export interface RoundDetailResponse {
  round: {
    id: number;
    title: string | null;
    startsAt: string;
    endsAt: string;
    createdAt: string;
    totalPoints: number;
    status: RoundStatus;
    winner: LeaderboardRow | null;
  };
  leaderboard: LeaderboardRow[];
  me: LeaderboardRow | null;
}

export interface TapResponse {
  taps: number;
  points: number;
  roundPoints: number;
}
