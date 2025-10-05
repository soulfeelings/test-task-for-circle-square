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

  // Получить текущего пользователя
  async getMe(): Promise<User> {
    return this.request<User>("/me");
  }

  // Получить список раундов
  async getRounds(): Promise<Round[]> {
    return this.request<Round[]>("/rounds");
  }

  // Создать новый раунд (admin only)
  async createRound(): Promise<Round> {
    return this.request<Round>("/rounds", {
      method: "POST",
    });
  }

  // Тап по гусю
  async tap(roundId: string): Promise<TapResponse> {
    return this.request<TapResponse>("/taps", {
      method: "POST",
      body: JSON.stringify({ roundId }),
    });
  }

  // Получить статистику раунда
  async getRoundStats(roundId: string): Promise<RoundStats> {
    return this.request<RoundStats>(`/rounds/${roundId}/stats`);
  }

  // Long polling для получения обновлений раунда
  async pollRoundUpdates(
    roundId: string,
    timeout: number = 30000
  ): Promise<Round> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(
        `${API_BASE}/rounds/${roundId}/poll?username=${this.username}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Polling timeout");
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
