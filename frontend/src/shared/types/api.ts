// API контракты для игры "The Last of Guss"

export interface User {
  id: string;
  username: string;
  role: "survivor" | "nikita" | "admin";
}

export interface Round {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: "cooldown" | "active" | "finished";
}

export interface Tap {
  id: string;
  userId: string;
  roundId: string;
  timestamp: string;
  points: number;
}

export interface RoundStats {
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

// API запросы
export interface CreateRoundRequest {
  // Admin создает раунд
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

// WebSocket события
export interface WebSocketEvent {
  type: "round_status_changed" | "tap_update" | "stats_update";
  data: any;
}
