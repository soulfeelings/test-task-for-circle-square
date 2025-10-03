import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createRound, fetchRounds } from '../api/client';
import type { RoundSummary } from '../api/types';
import { useAuth } from '../hooks/useAuth';
import { RoundStatusBadge } from '../components/RoundStatusBadge';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function RoundsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isPending } = useQuery({ queryKey: ['rounds'], queryFn: fetchRounds, refetchInterval: 10000 });

  const createRoundMutation = useMutation({
    mutationFn: (title?: string) => createRound(title),
    onSuccess: (response) => {
      navigate(`/rounds/${response.round.id}`);
    }
  });

  const rounds = useMemo<RoundSummary[]>(() => data?.rounds ?? [], [data?.rounds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Раунды</h2>
        {user?.role === 'admin' ? (
          <button
            type="button"
            onClick={() => {
              const title = window.prompt('Название раунда (необязательно)');
              createRoundMutation.mutate(title ?? undefined);
            }}
            disabled={createRoundMutation.isPending}
            style={{
              backgroundColor: '#2563eb',
              color: '#f8fafc',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {createRoundMutation.isPending ? 'Создаем...' : 'Создать раунд'}
          </button>
        ) : null}
      </div>
      {isPending ? (
        <p>Загрузка...</p>
      ) : rounds.length === 0 ? (
        <p>Пока нет раундов</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rounds.map((round) => (
            <div
              key={round.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.2rem',
                borderRadius: '0.9rem',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/rounds/${round.id}`)}
                  style={{
                    textAlign: 'left',
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  Раунд #{round.id} {round.title ? `· ${round.title}` : ''}
                </button>
                <span>Начало: {formatDate(round.startsAt)}</span>
                <span>Окончание: {formatDate(round.endsAt)}</span>
              </div>
              <RoundStatusBadge status={round.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
