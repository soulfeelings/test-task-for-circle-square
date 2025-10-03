import { Round } from '../entities/Round.js';

type RoundStatus = 'scheduled' | 'active' | 'completed';

export function getRoundStatus(round: Round, referenceDate: Date = new Date()): RoundStatus {
  if (referenceDate < round.startsAt) {
    return 'scheduled';
  }
  if (referenceDate >= round.startsAt && referenceDate < round.endsAt) {
    return 'active';
  }
  return 'completed';
}

export type { RoundStatus };
