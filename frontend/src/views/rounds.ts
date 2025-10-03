import { createRound, listRounds, type RoundSummary } from '../api/client.js';
import { clearSession, type SessionState } from '../state/session.js';

interface RoundsViewOptions {
  readonly root: HTMLElement;
  readonly session: SessionState;
  readonly onOpenRound: (roundId: string) => void;
  readonly onLogout: () => void;
}

interface ViewState {
  rounds: RoundSummary[];
  loading: boolean;
  creating: boolean;
  error: string;
  creationError: string;
}

export function renderRoundList(options: RoundsViewOptions): void {
  const state: ViewState = {
    rounds: [],
    loading: true,
    creating: false,
    error: '',
    creationError: '',
  };

  loadRounds();
  update();

  function update(): void {
    options.root.innerHTML = renderTemplate(options.session, state);
    bindEvents();
  }

  function bindEvents(): void {
    const logoutButton = options.root.querySelector<HTMLButtonElement>('#logout-btn');
    logoutButton?.addEventListener('click', () => {
      clearSession();
      options.onLogout();
    });

    const createForm = options.root.querySelector<HTMLFormElement>('#create-round-form');
    if (createForm) {
      createForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (state.creating) {
          return;
        }
        const input = createForm.querySelector<HTMLInputElement>('input[name="name"]');
        const name = input?.value.trim() || '';
        await handleCreateRound(name);
      });
    }

    const roundLinks = options.root.querySelectorAll<HTMLElement>('[data-round-id]');
    roundLinks.forEach((element) => {
      element.addEventListener('click', () => {
        const roundId = element.dataset.roundId;
        if (roundId) {
          options.onOpenRound(roundId);
        }
      });
    });
  }

  async function loadRounds(): Promise<void> {
    state.loading = true;
    update();
    const response = await listRounds(options.session);
    state.loading = false;
    if (response.error || !response.data) {
      state.error = response.error ?? 'Не удалось загрузить раунды';
      state.rounds = [];
    } else {
      state.error = '';
      state.rounds = response.data.rounds;
    }
    update();
  }

  async function handleCreateRound(name: string): Promise<void> {
    if (options.session.user.role !== 'admin') {
      return;
    }
    state.creating = true;
    state.creationError = '';
    update();
    const response = await createRound(options.session, name);
    state.creating = false;
    if (response.error || !response.data) {
      state.creationError = response.error ?? 'Не удалось создать раунд';
      update();
      return;
    }
    await loadRounds();
    options.onOpenRound(response.data.round.id);
  }
}

function renderTemplate(session: SessionState, state: ViewState): string {
  const roundsMarkup = state.rounds
    .map((round) => renderRoundCard(round))
    .join('');
  const statusMessage = state.loading
    ? '<p>Загружаем раунды...</p>'
    : state.error
      ? `<p class="error-message">${state.error}</p>`
      : roundsMarkup || '<p>Пока нет активных раундов.</p>';

  return `
    <main>
      <nav>
        <div>
          <h2 style="margin: 0;">Привет, ${session.user.username}</h2>
          <p style="margin: 0; opacity: 0.75;">Роль: ${translateRole(session.user.role)}</p>
        </div>
        <button id="logout-btn">Выйти</button>
      </nav>
      <section class="card">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="margin: 0;">Раунды</h2>
          ${session.user.role === 'admin'
            ? `<form id="create-round-form" style="display: flex; gap: 0.5rem; align-items: center;">
                <input name="name" type="text" placeholder="Название раунда" aria-label="Название раунда" />
                <button type="submit" ${state.creating ? 'disabled' : ''}>${state.creating ? 'Создаем...' : 'Создать раунд'}</button>
              </form>`
            : ''}
        </header>
        ${state.creationError ? `<p class="error-message">${state.creationError}</p>` : ''}
        <div class="round-list">
          ${statusMessage}
        </div>
      </section>
    </main>
  `;
}

function renderRoundCard(round: RoundSummary): string {
  return `
    <article class="round-card" data-round-id="${round.id}">
      <h3>${round.name}</h3>
      <div class="status-label">${translateState(round.state)}</div>
      <p style="margin: 0.75rem 0 0;">Старт: ${formatDate(round.startAt)}</p>
      <p style="margin: 0.25rem 0 0;">Финиш: ${formatDate(round.endAt)}</p>
      <p style="margin: 0.5rem 0 0;">Общий счет: ${round.totalScore}</p>
      ${round.state === 'finished' && round.winner ? `<p style="margin: 0.5rem 0 0;">Победитель: ${round.winner}</p>` : ''}
      <button style="margin-top: auto;">Перейти</button>
    </article>
  `;
}

function translateRole(role: SessionState['user']['role']): string {
  switch (role) {
    case 'admin':
      return 'Админ';
    case 'nikita':
      return 'Никита';
    default:
      return 'Выживший';
  }
}

function translateState(state: RoundSummary['state']): string {
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
