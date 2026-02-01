import type { User } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    user?: User;
  }

  interface FastifyInstance {
    authenticate?: any;
  }
}

// Типы для WebSocket
export interface WebSocketConnection {
  socket: WebSocket;
  isAlive: boolean;
}

// Типы для событий WebSocket
export interface WebSocketMessage {
  type:
    | "round_status_changed"
    | "tap_update"
    | "stats_update"
    | "ping"
    | "pong";
  data: any;
  timestamp?: string;
}

// Типы для ответов API
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}
