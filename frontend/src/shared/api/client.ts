import type { User, Round, RoundStats, TapResponse } from "@shared/types/api";

const API_BASE = "/api";

class ApiClient {
  private username: string = "";

  setUsername(username: string) {
    this.username = username;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    if (this.username) {
      url.searchParams.set("username", this.username);
    }

    const headers: Record<string, string> = {};

    // Добавляем Content-Type только если есть тело запроса
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    // Добавляем пользовательские заголовки
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(url.toString(), {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Логин пользователя
  async login(username: string): Promise<User> {
    return this.request<User>("/login", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  }

  // Получить текущего пользователя
  async getMe(): Promise<User> {
    return this.request<User>("/me");
  }

  // Получить список раундов
  async getRounds(): Promise<Round[]> {
    return this.request<Round[]>("/rounds");
  }

  // Получить раунд по ID
  async getRoundById(id: string): Promise<Round> {
    return this.request<Round>(`/rounds/${id}`);
  }

  // Создать новый раунд (admin only)
  async createRound(): Promise<Round> {
    return this.request<Round>("/rounds", {
      method: "POST",
    });
  }

  // Получить статистику игрока в раунде
  async getUserRoundStats(
    roundId: string
  ): Promise<{ taps: number; points: number }> {
    return this.request<{ taps: number; points: number }>(
      `/taps/stats/${roundId}`
    );
  }

  // Тап по гусю
  async tap(roundId: string): Promise<TapResponse> {
    return this.request<TapResponse>("/taps", {
      method: "POST",
      body: JSON.stringify({ roundId }),
    });
  }

  // Batch тапов
  async batchTap(roundId: string, count: number): Promise<TapResponse> {
    return this.request<TapResponse>("/taps/batch", {
      method: "POST",
      body: JSON.stringify({ roundId, count }),
    });
  }

  // Получить статистику раунда
  async getRoundStats(roundId: string): Promise<RoundStats> {
    return this.request<RoundStats>(`/rounds/${roundId}/stats`);
  }
}

export const apiClient = new ApiClient();
