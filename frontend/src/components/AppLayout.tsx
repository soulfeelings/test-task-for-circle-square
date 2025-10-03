import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Link to="/" style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          The Last of Guss
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>{user?.username}</span>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              backgroundColor: '#e2e8f0',
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Выйти
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '2rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
