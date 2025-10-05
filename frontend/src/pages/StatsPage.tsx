import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../shared/contexts/UserContext';
import { apiClient } from '../shared/api/client';
import type { RoundStats } from '../shared/types/api';

export default function StatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<RoundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();

  useEffect(() => {
    if (id) {
      loadStats();
    }
  }, [id]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRoundStats(id!);
      setStats(data);
    } catch (error) {
      setError('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка статистики...</div>;
  }

  if (error || !stats) {
    return (
      <div className="error-page">
        <div className="error">{error || 'Статистика не найдена'}</div>
        <Link to="/rounds" className="back-button">← Назад к раундам</Link>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <header className="page-header">
        <h1>🦆 The Last of Guss</h1>
        <div className="user-info">
          <span>Игрок: {user?.username}</span>
          <Link to="/rounds" className="back-button">← Назад к раундам</Link>
        </div>
      </header>

      <div className="stats-container">
        <div className="stats-header">
          <h2>Статистика раунда {stats.roundId}</h2>
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
        </div>

        <div className="stats-content">
          <div className="stats-summary">
            <div className="summary-line">────────────────────────────────────────────────────────────</div>
            <div className="total-stats">
              <div className="stat-item">
                <span className="stat-label">Всего тапов:</span>
                <span className="stat-value">{stats.totalTaps}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Всего очков:</span>
                <span className="stat-value">{stats.totalPoints}</span>
              </div>
            </div>
            
            {stats.winner && (
              <div className="winner">
                <div className="winner-label">Победитель:</div>
                <div className="winner-name">{stats.winner.username}</div>
                <div className="winner-points">{stats.winner.points} очков</div>
              </div>
            )}
          </div>

          <div className="players-stats">
            <h3>Результаты игроков:</h3>
            <div className="stats-table">
              <div className="table-header">
                <div className="col-name">Игрок</div>
                <div className="col-taps">Тапы</div>
                <div className="col-points">Очки</div>
              </div>
              {stats.userStats
                .sort((a, b) => b.points - a.points)
                .map((player, index) => (
                  <div 
                    key={player.username} 
                    className={`table-row ${player.username === user?.username ? 'current-user' : ''}`}
                  >
                    <div className="col-name">
                      {index === 0 && stats.winner?.username === player.username && '🏆 '}
                      {player.username}
                      {player.username === user?.username && ' (вы)'}
                    </div>
                    <div className="col-taps">{player.taps}</div>
                    <div className="col-points">{player.points}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
