import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRound, tapRound } from '../api/client';
import type { LeaderboardRow } from '../api/types';
import { RoundStatusBadge } from '../components/RoundStatusBadge';
import { useNow } from '../hooks/useNow';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function RoundPage() {
  const params = useParams();
  const roundId = Number(params.roundId);
  const now = useNow();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ['round', roundId],
    queryFn: () => fetchRound(roundId),
    enabled: Number.isFinite(roundId),
    refetchInterval: 2000
  });

  const tapMutation = useMutation({
    mutationFn: () => tapRound(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round', roundId] });
    }
  });

  const round = data?.round;
  const leaderboard = data?.leaderboard ?? [];
  const me = data?.me;

  const countdownMessage = useMemo(() => {
    if (!round) {
      return null;
    }
    const startsAt = new Date(round.startsAt);
    const endsAt = new Date(round.endsAt);

    if (round.status === 'scheduled') {
      return `До старта: ${formatDuration(startsAt.getTime() - now.getTime())}`;
    }
    if (round.status === 'active') {
      return `До завершения: ${formatDuration(endsAt.getTime() - now.getTime())}`;
    }
    return null;
  }, [now, round]);

  if (!Number.isFinite(roundId)) {
    return <p>Некорректный идентификатор раунда</p>;
  }

  if (isPending || !round) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <h2 style={{ margin: 0 }}>Раунд #{round.id}</h2>
          {round.title ? <span>«{round.title}»</span> : null}
          <span>Начало: {formatDate(round.startsAt)}</span>
          <span>Окончание: {formatDate(round.endsAt)}</span>
          {countdownMessage ? <strong>{countdownMessage}</strong> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <RoundStatusBadge status={round.status} />
          <span style={{ fontWeight: 600 }}>Очки раунда: {round.totalPoints}</span>
          {round.winner ? (
            <span>
              Победитель: <strong>{round.winner.username}</strong> ({round.winner.points} очков)
            </span>
          ) : null}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Гусь</h3>
          <button
            type="button"
            onClick={() => tapMutation.mutate()}
            disabled={round.status !== 'active' || tapMutation.isPending}
            style={{
              padding: '0.8rem 1.2rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: round.status === 'active' ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              backgroundColor: round.status === 'active' ? '#ef4444' : '#94a3b8',
              color: '#f8fafc'
            }}
          >
            {round.status === 'active' ? 'Тап' : 'Недоступно'}
          </button>
        </div>
        {me ? (
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              fontWeight: 600
            }}
          >
            <span>Ваши очки: {me.points}</span>
            <span>Ваши тапы: {me.taps}</span>
          </div>
        ) : (
          <p>Сделайте первый тап, чтобы появиться в таблице.</p>
        )}
      </div>

      <div>
        <h3>Таблица участников</h3>
        {leaderboard.length === 0 ? (
          <p>Пока никто не тапнул гуся.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: '#e2e8f0' }}>
                  <th style={{ padding: '0.75rem' }}>Место</th>
                  <th style={{ padding: '0.75rem' }}>Игрок</th>
                  <th style={{ padding: '0.75rem' }}>Тапы</th>
                  <th style={{ padding: '0.75rem' }}>Очки</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row: LeaderboardRow, index) => (
                  <tr key={row.userId} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{index + 1}</td>
                    <td style={{ padding: '0.75rem' }}>{row.username}</td>
                    <td style={{ padding: '0.75rem' }}>{row.taps}</td>
                    <td style={{ padding: '0.75rem' }}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
