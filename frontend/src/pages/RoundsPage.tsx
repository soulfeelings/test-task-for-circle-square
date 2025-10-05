import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const { user, logout } = useUser();

  useEffect(() => {
    loadRounds();
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
      await apiClient.createRound();
      await loadRounds();
    } catch (error) {
      setError("Ошибка создания раунда");
    }
  };

  const getRoundStatus = (round: Round) => {
    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime) return "cooldown";
    if (now > endTime) return "finished";
    return "active";
  };

  const getTimeRemaining = (round: Round) => {
    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime) {
      const diff = startTime.getTime() - now.getTime();
      return Math.ceil(diff / 1000);
    }
    if (now < endTime) {
      const diff = endTime.getTime() - now.getTime();
      return Math.ceil(diff / 1000);
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

  if (loading) {
    return <div className="loading">Загрузка раундов...</div>;
  }

  return (
    <div className={styles.roundsPage}>
      <PageHeader />

      {error && <div className="error">{error}</div>}

      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2>Раунды</h2>
          {user?.role === "ADMIN" && (
            <button onClick={handleCreateRound} className={styles.createButton}>
              Создать раунд
            </button>
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
                    {status === "cooldown"
                      ? "Cooldown"
                      : status === "active"
                      ? "Активен"
                      : "Завершен"}
                  </div>
                  {status !== "finished" && (
                    <div className={styles.timer}>
                      {status === "cooldown" ? "До начала: " : "До конца: "}
                      {formatTime(timeRemaining)}
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  {status === "active" && (
                    <Link
                      to={createRoute.round(round.id)}
                      className={styles.playButton}
                    >
                      Играть
                    </Link>
                  )}
                  <Link
                    to={createRoute.roundStats(round.id)}
                    className={styles.statsButton}
                  >
                    Статистика
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
