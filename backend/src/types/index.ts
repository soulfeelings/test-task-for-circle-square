import type { User, Round, Tap, UserRoundStats } from "@prisma/client";
import { UserRole, RoundStatus } from "@prisma/client";

// Расширенные типы с дополнительными полями
export interface UserWithStats extends User {
  userRoundStats?: UserRoundStats[];
}

export interface RoundWithStats extends Round {
  taps?: Tap[];
  userRoundStats?: UserRoundStats[];
}

export interface RoundWithTaps extends Round {
  taps: Tap[];
}

export interface UserWithTaps extends User {
  taps: Tap[];
}

// API Request/Response типы
export interface CreateRoundRequest {
  // Пока пустой, но может быть расширен
}

export interface CreateUserRequest {
  username: string;
}

export interface TapRequest {
  roundId: string;
}

export interface TapResponse {
  success: boolean;
  points: number;
  totalPoints: number;
  message?: string;
}

export interface RoundStatsResponse {
  roundId: string;
  totalTaps: number;
  totalPoints: number;
  winner?: {
    username: string;
    points: number;
  };
  userStats: {
    username: string;
    taps: number;
    points: number;
  }[];
}

export interface UserStatsResponse {
  taps: number;
  points: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

// WebSocket события
export interface WebSocketEvent {
  type:
    | "round_status_changed"
    | "tap_update"
    | "stats_update"
    | "ping"
    | "pong";
  data: any;
  timestamp?: string;
}

// Конфигурация игры
export interface GameConfig {
  roundDuration: number; // в секундах
  cooldownDuration: number; // в секундах
}

// Типы для сервисов
export interface TapResult {
  success: boolean;
  points: number;
  totalPoints: number;
  message?: string;
}

// Типы для параметров маршрутов
export interface RoundParams {
  id: string;
}

export interface TapParams {
  roundId: string;
}

// Типы для валидации
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Типы для пагинации (на будущее)
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Экспорт Prisma типов
export type { User, Round, Tap, UserRoundStats, UserRole, RoundStatus };
