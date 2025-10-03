import { login } from '../api/client.js';
import { saveSession, type SessionState } from '../state/session.js';

interface LoginViewOptions {
  readonly root: HTMLElement;
  readonly onSuccess: (session: SessionState) => void;
}

export function renderLogin(options: LoginViewOptions): void {
  const state = {
    loading: false,
    error: '',
  };
  options.root.innerHTML = createTemplate(state.error, state.loading);
  const form = options.root.querySelector('form');
  const usernameInput = options.root.querySelector<HTMLInputElement>('input[name="username"]');
  const passwordInput = options.root.querySelector<HTMLInputElement>('input[name="password"]');
  const errorElement = options.root.querySelector<HTMLElement>('.error-message');
  if (!form || !usernameInput || !passwordInput || !errorElement) {
    return;
  }
  const errorTarget = errorElement;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.loading) {
      return;
    }
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      updateError('Введите имя и пароль');
      return;
    }
    setLoading(true);
    const response = await login(username, password);
    if (response.error || !response.data) {
      updateError(response.error ?? 'Не удалось войти');
      setLoading(false);
      return;
    }
    const session: SessionState = {
      token: response.data.token,
      user: response.data.user,
    };
    saveSession(session);
    options.onSuccess(session);
  });

  function updateError(message: string): void {
    state.error = message;
    errorTarget.textContent = message;
    errorTarget.style.display = message ? 'block' : 'none';
  }

  function setLoading(loading: boolean): void {
    state.loading = loading;
    const submitButton = options.root.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.textContent = loading ? 'Входим...' : 'Войти';
    }
  }
}

function createTemplate(error: string, loading: boolean): string {
  return `
    <main>
      <section class="card">
        <h1>Добро пожаловать в The Last of Guss</h1>
        <p>Введите имя и пароль, чтобы присоединиться к охоте за мутировавшим гусем.</p>
        <form>
          <label>
            Имя
            <input name="username" type="text" autocomplete="username" required />
          </label>
          <label style="margin-top: 1rem; display: block;">
            Пароль
            <input name="password" type="password" autocomplete="current-password" required />
          </label>
          <button type="submit" style="margin-top: 1.5rem;" ${loading ? 'disabled' : ''}>Войти</button>
        </form>
        <p class="error-message" style="display: ${error ? 'block' : 'none'};">${error}</p>
      </section>
    </main>
  `;
}
