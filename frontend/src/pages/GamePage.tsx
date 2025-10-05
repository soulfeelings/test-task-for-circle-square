import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../shared/contexts/UserContext";
import { apiClient } from "../shared/api/client";
import type { Round } from "../shared/types/api";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useUser();

  useEffect(() => {
    if (id) {
      loadRound();
      startTimer();
    }
  }, [id]);

  const loadRound = async () => {
    try {
      const rounds = await apiClient.getRounds();
      const currentRound = rounds.find((r) => r.id === id);
      setRound(currentRound || null);
    } catch (error) {
      console.error("Error loading round:", error);
    }
  };

  const startTimer = () => {
    let isPolling = true;

    const pollForUpdates = async () => {
      if (!round || !isPolling) return;

      try {
        const updatedRound = await apiClient.pollRoundUpdates(round.id, 30000);
        setRound(updatedRound);

        // Если раунд еще активен или в cooldown, продолжаем polling
        const now = new Date();
        const startTime = new Date(updatedRound.startTime);
        const endTime = new Date(updatedRound.endTime);

        if (now < endTime) {
          setTimeout(pollForUpdates, 1000); // Небольшая задержка перед следующим запросом
        }
      } catch (error) {
        console.error("Polling error:", error);
        // При ошибке продолжаем polling через 5 секунд
        if (isPolling) {
          setTimeout(pollForUpdates, 5000);
        }
      }
    };

    // Запускаем polling
    pollForUpdates();

    // Обновляем таймер каждую секунду для плавного отображения
    const interval = setInterval(() => {
      if (round) {
        const now = new Date();
        const startTime = new Date(round.startTime);
        const endTime = new Date(round.endTime);

        if (now < startTime) {
          setTimeRemaining(
            Math.ceil((startTime.getTime() - now.getTime()) / 1000)
          );
        } else if (now < endTime) {
          setTimeRemaining(
            Math.ceil((endTime.getTime() - now.getTime()) / 1000)
          );
        } else {
          setTimeRemaining(0);
        }
      }
    }, 1000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  };

  const handleTap = async () => {
    if (!round || !id || isTapping) return;

    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime || now > endTime) {
      setMessage("Раунд не активен!");
      return;
    }

    setIsTapping(true);
    try {
      const response = await apiClient.tap(id);
      if (response.success) {
        setUserPoints(response.totalPoints);
        if (response.message) {
          setMessage(response.message);
          setTimeout(() => setMessage(""), 2000);
        }
      } else {
        setMessage(response.message || "Ошибка тапа");
      }
    } catch (error) {
      setMessage("Ошибка соединения");
    } finally {
      setIsTapping(false);
    }
  };

  const getRoundStatus = () => {
    if (!round) return "loading";

    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    if (now < startTime) return "cooldown";
    if (now > endTime) return "finished";
    return "active";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const status = getRoundStatus();

  if (!round) {
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
          <div className="round-id">Round ID: {round.id}</div>
          <div className="game-status">
            {status === "cooldown" && (
              <>
                <div className="status">Cooldown</div>
                <div className="timer">
                  до начала раунда {formatTime(timeRemaining)}
                </div>
              </>
            )}
            {status === "active" && (
              <>
                <div className="status">Раунд активен!</div>
                <div className="timer">
                  До конца осталось: {formatTime(timeRemaining)}
                </div>
                <div className="user-points">Мои очки - {userPoints}</div>
              </>
            )}
            {status === "finished" && (
              <>
                <div className="status">Раунд завершен</div>
                <Link
                  to={`/round/${round.id}/stats`}
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
            <pre>{`
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

          {status === "active" && (
            <button
              onClick={handleTap}
              disabled={isTapping}
              className={`goose-button ${isTapping ? "tapping" : ""}`}
            >
              {isTapping ? "ТАП!" : "ТАПАТЬ ГУСЯ"}
            </button>
          )}
        </div>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
