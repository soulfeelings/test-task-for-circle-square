import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../shared/contexts/UserContext";
import { apiClient } from "../shared/api/client";
import type { Round } from "../shared/types/api";
import styles from "./GamePage.module.scss";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [isLoadingUserStats, setIsLoadingUserStats] = useState(false);
  const { user } = useUser();

  const [stats, setStats] = useState({ taps: 0, points: 0 });
  const syncTapsRef = useRef<number>(0);

  useEffect(() => {
    if (id) {
      loadRound();
      loadUserStats();
    }
  }, [id]);

  useEffect(() => {
    if (!round) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const startTime = new Date(round.startTime);
      const endTime = new Date(round.endTime);

      if (now < startTime) {
        const remaining = Math.floor(
          (startTime.getTime() - now.getTime()) / 1000
        );
        setTimeRemaining(remaining);

        // Обновляем раунд когда начинается (переход из COOLDOWN в ACTIVE)
        if (remaining === 0) {
          await loadRound();
        }
      } else if (now < endTime) {
        const remaining = Math.floor(
          (endTime.getTime() - now.getTime()) / 1000
        );
        setTimeRemaining(remaining);

        // Обновляем раунд когда заканчивается (переход из ACTIVE в FINISHED)
        if (remaining === 0) {
          await loadRound();
        }
      } else {
        setTimeRemaining(0);
        await loadRound();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [round, id]);

  const loadRound = async () => {
    if (!id) return;
    setIsLoadingRound(true);
    try {
      const roundData = await apiClient.getRoundById(id);
      setRound(roundData);
    } catch (error) {
      console.error("Error loading round:", error);
    } finally {
      setIsLoadingRound(false);
    }
  };

  const loadUserStats = async () => {
    if (!id) return;
    setIsLoadingUserStats(true);
    try {
      const userStats = await apiClient.getUserRoundStats(id);
      setStats(userStats);
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setIsLoadingUserStats(false);
    }
  };

  const syncTaps = useCallback(async () => {
    if (!id || syncTapsRef.current === 0) return;
    const taps = syncTapsRef.current;

    try {
      syncTapsRef.current = 0;
      const response = await apiClient.batchTap(id, taps);
      console.log("Taps synced:", response);
    } catch (error) {
      syncTapsRef.current = syncTapsRef.current + taps;
      console.error("Error syncing taps:", error);
    }
  }, [id]);

  // Batch отправка тапов каждые 3 секунды
  useEffect(() => {
    if (!id) return;

    const syncInterval = setInterval(() => {
      syncTaps();
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [syncTaps]);

  const calculateTapPoints = (tapCount: number): number => {
    return tapCount % 11 === 0 ? 10 : 1;
  };

  const handleTap = () => {
    if (!round || !id) return;

    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime || now > endTime) {
      setMessage("Раунд не активен!");
      return;
    }

    // Увеличиваем счетчик тапов и очков
    setStats((prev) => {
      const newTapCount = prev.taps + 1;
      const tapPoints = calculateTapPoints(newTapCount);
      return {
        taps: newTapCount,
        points: prev.points + tapPoints,
      };
    });
    syncTapsRef.current++;
  };

  const getRoundStatus = () => {
    if (!round) return "loading";

    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime) return "COOLDOWN";
    if (now > endTime) return "FINISHED";
    return "ACTIVE";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const status = getRoundStatus();

  if (!round && isLoadingRound) {
    return <div className="loading">Загрузка раунда...</div>;
  }

  if (isLoadingUserStats) {
    return <div className="loading">Загрузка раунда...</div>;
  }

  return (
    <div className="game-page">
      <header className="page-header">
        <h1>🦆 The Last of Guss</h1>
        <div className="user-info">
          <span>Игрок: {user?.username}</span>
          <Link to="/rounds" className="back-button">
            ← Назад к раундам
          </Link>
        </div>
      </header>

      <div className="game-container">
        <div className="game-info">
          <div className="round-id">Round ID: {round?.id}</div>
          <div className="game-status">
            {status === "COOLDOWN" && (
              <>
                <div className="status">Cooldown</div>
                <div className="timer">
                  до начала раунда {formatTime(timeRemaining)}
                </div>
              </>
            )}
            {status === "ACTIVE" && (
              <>
                <div className="status">Раунд активен!</div>
                <div className="timer">
                  До конца осталось: {formatTime(timeRemaining)}
                </div>
                <div className="user-points">
                  Тапы: {stats.taps} | Очки: {stats.points}
                </div>
              </>
            )}
            {status === "FINISHED" && (
              <>
                <div className="status">Раунд завершен</div>
                <Link
                  to={`/round/${round?.id}/stats`}
                  className="view-stats-button"
                >
                  Посмотреть статистику
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="goose-container">
          <div className="goose-art">
            <pre className={styles.gooseArtPre} onClick={handleTap}>{`
            ░░░░░░░░░░░░░░░
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░
    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
        ░░░░░░░░░░░░░░░░░░░░░░░░░░
            `}</pre>
          </div>
        </div>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
