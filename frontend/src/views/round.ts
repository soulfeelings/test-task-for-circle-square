import { getRound, tapRound, type RoundDetails } from '../api/client.js';
import { clearSession, type SessionState } from '../state/session.js';

interface RoundViewOptions {
  readonly root: HTMLElement;
  readonly session: SessionState;
  readonly roundId: string;
  readonly onBack: () => void;
  readonly onLogout: () => void;
}

interface ViewState {
  round: RoundDetails | null;
  loading: boolean;
  tapping: boolean;
  error: string;
  tapError: string;
}

export function renderRoundDetails(options: RoundViewOptions): void {
  const state: ViewState = {
    round: null,
    loading: true,
    tapping: false,
    error: '',
    tapError: '',
  };

  update();
  void loadRound();

  function update(): void {
    options.root.innerHTML = createTemplate(options.session, state);
    bindEvents();
  }

  function bindEvents(): void {
    const backButton = options.root.querySelector<HTMLButtonElement>('#back-btn');
    backButton?.addEventListener('click', () => options.onBack());
    const logoutButton = options.root.querySelector<HTMLButtonElement>('#logout-btn');
    logoutButton?.addEventListener('click', () => {
      clearSession();
      options.onLogout();
    });
    const tapButton = options.root.querySelector<HTMLButtonElement>('#tap-btn');
    if (tapButton) {
      tapButton.addEventListener('click', async () => {
        if (state.tapping || !state.round) {
          return;
        }
        await handleTap();
      });
    }
  }

  async function loadRound(): Promise<void> {
    state.loading = true;
    update();
    const response = await getRound(options.session, options.roundId);
    state.loading = false;
    if (response.error || !response.data) {
      state.error = response.error ?? 'Не удалось загрузить раунд';
      state.round = null;
    } else {
      state.error = '';
      state.round = response.data.round;
    }
    update();
  }

  async function handleTap(): Promise<void> {
    if (!state.round) {
      return;
    }
    state.tapping = true;
    state.tapError = '';
    update();
    const response = await tapRound(options.session, options.roundId);
    state.tapping = false;
    if (response.error || !response.data) {
      state.tapError = response.error ?? 'Не удалось тапнуть';
      update();
      return;
    }
    const tap = response.data.tap;
    state.round = {
      ...state.round,
      totalScore: tap.totalScore,
      you: {
        tapCount: tap.userTapCount,
        score: tap.userScore,
      },
      state: tap.roundState,
    };
    update();
  }
}

function createTemplate(session: SessionState, state: ViewState): string {
  if (state.loading) {
    return `
      <main>
        <nav>
          <button id="back-btn">Назад</button>
          <button id="logout-btn">Выйти</button>
        </nav>
        <section class="card">
          <p>Загрузка...</p>
        </section>
      </main>
    `;
  }
  if (state.error || !state.round) {
    return `
      <main>
        <nav>
          <button id="back-btn">Назад</button>
          <button id="logout-btn">Выйти</button>
        </nav>
        <section class="card">
          <p class="error-message">${state.error}</p>
        </section>
      </main>
    `;
  }

  const round = state.round;
  const isActive = round.state === 'active';
  const tapInfo = round.you ?? { tapCount: 0, score: 0 };

  return `
    <main>
      <nav>
        <button id="back-btn">Назад</button>
        <div style="display: flex; gap: 0.75rem;">
          <span>Игрок: ${session.user.username}</span>
          <button id="logout-btn">Выйти</button>
        </div>
      </nav>
      <section class="card" style="text-align: center;">
        <h2 style="margin-top: 0;">${round.name}</h2>
        <p>Статус: ${translateState(round.state)}</p>
        <p>Начало: ${formatDate(round.startAt)} · Конец: ${formatDate(round.endAt)}</p>
        <p>Ваш счет: ${tapInfo.score} · Тапы: ${tapInfo.tapCount}</p>
        <p>Общий счет раунда: ${round.totalScore}</p>
        ${state.tapError ? `<p class="error-message">${state.tapError}</p>` : ''}
        <div style="margin: 2rem 0; display: flex; justify-content: center;">
          <button id="tap-btn" class="goose-button" ${isActive ? '' : 'disabled'} ${state.tapping ? 'disabled' : ''}>
            ${isActive ? (state.tapping ? '...' : 'Тапнуть гуся') : 'Гусь отдыхает'}
          </button>
        </div>
        ${round.state === 'finished' && round.winner ? `<p>Победитель: ${round.winner}</p>` : ''}
      </section>
    </main>
  `;
}

function translateState(state: RoundDetails['state']): string {
  switch (state) {
    case 'scheduled':
      return 'Ожидание';
    case 'active':
      return 'Активен';
    case 'finished':
      return 'Завершен';
  }
}

function formatDate(timestamp: number): string {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
  return formatter.format(new Date(timestamp));
}
