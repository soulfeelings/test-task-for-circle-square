import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@shared/contexts/UserContext";
import { apiClient } from "@shared/api/client";
import { createRoute } from "@/app/routes";
import PageHeader from "@shared/components/PageHeader";
import type { Round } from "@shared/types/api";
import styles from "./RoundsPage.module.scss";

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadRounds();

    // Обновляем список раундов каждые 5 секунд для актуальных статусов
    const refreshInterval = setInterval(() => {
      loadRounds();
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const loadRounds = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRounds();
      setRounds(data);
    } catch (error) {
      setError("Ошибка загрузки раундов");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async () => {
    try {
      const round = await apiClient.createRound();
      console.log("Round created:", round);
      navigate(createRoute.round(round.id));
    } catch (error) {
      setError("Ошибка создания раунда");
    }
  };

  const getRoundStatus = (round: Round) => {
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (new Date() < startTime) return "COOLDOWN";
    if (new Date() > endTime) return "FINISHED";
    return "ACTIVE";
  };

  const getTimeRemaining = (round: Round) => {
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (new Date() < startTime) {
      const diff = startTime.getTime() - new Date().getTime();
      return Math.max(0, Math.floor(diff / 1000));
    }
    if (new Date() < endTime) {
      const diff = endTime.getTime() - new Date().getTime();
      return Math.max(0, Math.floor(diff / 1000));
    }
    return 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading && !rounds.length) {
    return <div className="loading">Загрузка раундов...</div>;
  }

  return (
    <div className={styles.roundsPage}>
      <PageHeader />

      {error && <div className="error">{error}</div>}

      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2>Раунды</h2>
          {user?.role === "ADMIN" ? (
            <button onClick={handleCreateRound} className={styles.createButton}>
              Создать раунд
            </button>
          ) : (
            <div style={{ color: "#666", fontSize: "0.9rem" }}>
              Роль: {user?.role || "не авторизован"}
            </div>
          )}
        </div>

        <div className={styles.list}>
          {rounds.map((round) => {
            const status = getRoundStatus(round);
            const timeRemaining = getTimeRemaining(round);

            return (
              <div
                key={round.id}
                className={`${styles.card} ${styles[status]}`}
              >
                <div className={styles.roundId}>● Round ID: {round.id}</div>
                <div className={styles.time}>
                  <div>Start: {new Date(round.startTime).toLocaleString()}</div>
                  <div>End: {new Date(round.endTime).toLocaleString()}</div>
                </div>
                <div className={styles.status}>
                  <div className={styles.statusLine}>
                    ────────────────────────────────────────────────────────────
                  </div>
                  <div className={styles.status}>
                    Статус:{" "}
                    {status === "COOLDOWN"
                      ? "Cooldown"
                      : status === "ACTIVE"
                      ? "Активен"
                      : "Завершен"}
                  </div>
                  {status !== "FINISHED" && (
                    <div className={styles.timer}>
                      {status === "COOLDOWN" ? "До начала: " : "До конца: "}
                      {formatTime(timeRemaining)}
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  {status === "ACTIVE" && (
                    <Link
                      to={createRoute.round(round.id)}
                      className={styles.playButton}
                    >
                      Играть
                    </Link>
                  )}
                  {status !== "COOLDOWN" && (
                    <Link
                      to={createRoute.roundStats(round.id)}
                      className={styles.statsButton}
                    >
                      Статистика
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
