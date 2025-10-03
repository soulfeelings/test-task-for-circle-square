import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #bae6fd 0%, #f8fafc 60%)'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 40px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <h1 style={{ margin: 0, textAlign: 'center' }}>The Last of Guss</h1>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span>Имя пользователя</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            placeholder="Введите имя"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5f5'
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Введите пароль"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5f5'
            }}
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isSubmitting ? 'Входим...' : 'Войти'}
        </button>
        {error ? <p style={{ color: '#dc2626', margin: 0 }}>{error}</p> : null}
      </form>
    </div>
  );
}
