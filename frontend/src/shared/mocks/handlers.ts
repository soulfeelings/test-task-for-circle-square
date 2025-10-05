import { http, HttpResponse } from "msw";
import type { User, Round, RoundStats, TapResponse } from "@shared/types/api";

// Моковые данные
const users: User[] = [
  { id: "1", username: "admin", role: "admin" },
  { id: "2", username: "Иван", role: "survivor" },
  { id: "3", username: "Никита", role: "nikita" },
  { id: "4", username: "Мария", role: "survivor" },
];

const rounds: Round[] = [
  {
    id: "1",
    startTime: new Date(Date.now() - 30000).toISOString(), // 30 сек назад
    endTime: new Date(Date.now() + 30000).toISOString(), // 30 сек вперед
    status: "active",
  },
  {
    id: "2",
    startTime: new Date(Date.now() + 30000).toISOString(), // 30 сек вперед
    endTime: new Date(Date.now() + 90000).toISOString(), // 90 сек вперед
    status: "cooldown",
  },
  {
    id: "3",
    startTime: new Date(Date.now() - 120000).toISOString(), // 2 мин назад
    endTime: new Date(Date.now() - 60000).toISOString(), // 1 мин назад
    status: "finished",
  },
];

const userStats = new Map<string, { taps: number; points: number }>();

export const handlers = [
  // Получить список раундов
  http.get("/api/rounds", () => {
    return HttpResponse.json(rounds);
  }),

  // Создать новый раунд (только admin)
  http.post("/api/rounds", async ({ request }) => {
    const user = await getUserFromRequest(request);
    if (user?.role !== "admin") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const newRound: Round = {
      id: Date.now().toString(),
      startTime: new Date(now.getTime() + 30000).toISOString(), // cooldown 30 сек
      endTime: new Date(now.getTime() + 90000).toISOString(), // длительность 60 сек
      status: "cooldown",
    };

    rounds.push(newRound);
    return HttpResponse.json(newRound);
  }),

  // Тап по гусю
  http.post("/api/taps", async ({ request }) => {
    const { roundId } = (await request.json()) as { roundId: string };
    const user = await getUserFromRequest(request);

    if (!user) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const round = rounds.find((r) => r.id === roundId);
    if (!round) {
      return HttpResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    // Проверяем, что раунд активен
    if (now < startTime || now > endTime) {
      return HttpResponse.json({
        success: false,
        message: "Round is not active",
      });
    }

    // Логика подсчета очков
    const userKey = `${user.id}-${roundId}`;
    const currentStats = userStats.get(userKey) || { taps: 0, points: 0 };
    currentStats.taps++;

    // Каждый 11-й тап дает 10 очков, остальные - 1 очко
    const points = currentStats.taps % 11 === 0 ? 10 : 1;

    // Никита получает 0 очков
    if (user.role === "nikita") {
      currentStats.points += 0;
    } else {
      currentStats.points += points;
    }

    userStats.set(userKey, currentStats);

    const response: TapResponse = {
      success: true,
      points: user.role === "nikita" ? 0 : points,
      totalPoints: currentStats.points,
      message: user.role === "nikita" ? "Никита не получает очков!" : undefined,
    };

    return HttpResponse.json(response);
  }),

  // Получить статистику раунда
  http.get("/api/rounds/:id/stats", ({ params }) => {
    const roundId = params.id as string;
    const round = rounds.find((r) => r.id === roundId);

    if (!round) {
      return HttpResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Собираем статистику всех игроков
    const stats: RoundStats = {
      roundId,
      totalTaps: 0,
      totalPoints: 0,
      userStats: [],
    };

    let maxPoints = 0;
    let winner: { username: string; points: number } | undefined;

    users.forEach((user) => {
      const userKey = `${user.id}-${roundId}`;
      const userStat = userStats.get(userKey) || { taps: 0, points: 0 };

      stats.totalTaps += userStat.taps;
      stats.totalPoints += userStat.points;

      stats.userStats.push({
        username: user.username,
        taps: userStat.taps,
        points: userStat.points,
      });

      if (userStat.points > maxPoints) {
        maxPoints = userStat.points;
        winner = { username: user.username, points: userStat.points };
      }
    });

    stats.winner = winner;
    return HttpResponse.json(stats);
  }),

  // Получить текущего пользователя
  http.get("/api/me", async ({ request }) => {
    const user = await getUserFromRequest(request);
    return HttpResponse.json(user);
  }),
];

// Вспомогательная функция для получения пользователя из запроса
async function getUserFromRequest(request: Request): Promise<User | null> {
  // В реальном приложении здесь была бы проверка токена
  // Для мока просто возвращаем первого пользователя
  const url = new URL(request.url);
  const username = url.searchParams.get("username") || "Иван";
  return users.find((u) => u.username === username) || users[1];
}
