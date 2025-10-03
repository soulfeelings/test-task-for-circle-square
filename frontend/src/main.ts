import { Router } from './router/router.js';
import { clearSession, loadSession, type SessionState } from './state/session.js';
import { renderLogin } from './views/login.js';
import { renderRoundList } from './views/rounds.js';
import { renderRoundDetails } from './views/round.js';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Root element not found');
}

let session: SessionState | null = loadSession();
const router = new Router();

router.register('/login', () => {
  if (session) {
    router.navigate('/rounds');
    return;
  }
  renderLogin({
    root,
    onSuccess: (newSession) => {
      session = newSession;
      router.navigate('/rounds');
    },
  });
});

router.register('/rounds', () => {
  const current = requireSession();
  if (!current) {
    return;
  }
  renderRoundList({
    root,
    session: current,
    onOpenRound: (roundId) => router.navigate(`/rounds/${roundId}`),
    onLogout: logout,
  });
});

router.register('/rounds/:id', (params) => {
  const current = requireSession();
  if (!current) {
    return;
  }
  const roundId = params['id'];
  if (!roundId) {
    router.navigate('/rounds');
    return;
  }
  renderRoundDetails({
    root,
    session: current,
    roundId,
    onBack: () => router.navigate('/rounds'),
    onLogout: logout,
  });
});

router.setDefault(() => {
  if (session) {
    router.navigate('/rounds');
  } else {
    router.navigate('/login');
  }
});

router.start();

function requireSession(): SessionState | null {
  if (!session) {
    router.navigate('/login');
    return null;
  }
  return session;
}

function logout(): void {
  session = null;
  clearSession();
  router.navigate('/login');
}
