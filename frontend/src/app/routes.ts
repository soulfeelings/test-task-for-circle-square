// Типизированные роуты приложения

export const routes = {
  // Базовые роуты
  login: '/login',
  rounds: '/rounds',
  
  // Роуты с параметрами
  round: (id: string) => `/round/${id}`,
  roundStats: (id: string) => `/round/${id}/stats`,
} as const;

// Типы для параметров роутов
export type RouteParams = {
  '/round/:id': { id: string };
  '/round/:id/stats': { id: string };
};

// Типы для всех возможных путей
export type AppRoute = 
  | '/login'
  | '/rounds'
  | `/round/${string}`
  | `/round/${string}/stats`;

// Утилиты для работы с роутами
export const createRoute = {
  round: (id: string) => routes.round(id),
  roundStats: (id: string) => routes.roundStats(id),
} as const;
