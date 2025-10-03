import type { RoundStatus } from '../api/types';

const STATUS_COLORS: Record<RoundStatus, string> = {
  scheduled: '#2563eb',
  active: '#16a34a',
  completed: '#6b7280'
};

const STATUS_LABELS: Record<RoundStatus, string> = {
  scheduled: 'Не начат',
  active: 'Активен',
  completed: 'Завершен'
};

export function RoundStatusBadge({ status }: { status: RoundStatus }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        backgroundColor: STATUS_COLORS[status],
        color: '#f8fafc',
        padding: '0.25rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.85rem',
        fontWeight: 500
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
