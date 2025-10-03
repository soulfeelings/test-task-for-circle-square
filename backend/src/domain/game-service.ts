import type { AppConfig } from '../config/env.js';
import type { Storage } from '../infrastructure/storage.js';
import {
  type AuthTokenPayload,
  type LoginResult,
  type Round,
  type RoundParticipant,
  type RoundState,
  type RoundView,
  type TapResult,
  type User,
  type UserRole,
} from './models.js';
import { createId } from '../utils/id.js';
import { createToken, hashPassword } from '../utils/security.js';

export interface CreateRoundInput {
  readonly name?: string;
}

export interface LoginInput {
  readonly username: string;
  readonly password: string;
}

export class GameService {
  constructor(private readonly storage: Storage, private readonly config: AppConfig) {}

  async login(input: LoginInput, now: number): Promise<LoginResult> {
    const username = this.normalizeUsername(input.username);
    if (!username) {
      throw new Error('Username is required');
    }
    const existingUser = await this.storage.findUserByUsername(username);
    if (existingUser) {
      const { hash } = hashPassword(input.password, existingUser.passwordSalt);
      if (hash !== existingUser.passwordHash) {
        throw new Error('Invalid credentials');
      }
      const token = this.createAuthToken(existingUser, now);
      return { token, user: existingUser };
    }
    const password = input.password ?? '';
    if (password.length < 4) {
      throw new Error('Password must contain at least 4 characters');
    }
    const { hash, salt } = hashPassword(password);
    const role = this.resolveRole(username);
    const user: User = {
      id: createId(),
      username,
      passwordHash: hash,
      passwordSalt: salt,
      role,
      createdAt: now,
    };
    await this.storage.createUser(user);
    const token = this.createAuthToken(user, now);
    return { token, user };
  }

  async createRound(actor: User, input: CreateRoundInput, now: number): Promise<Round> {
    this.ensureAdmin(actor);
    const name = input.name?.trim() || `Round ${new Date(now).toISOString()}`;
    const startAt = now + this.config.cooldownDurationMs;
    const endAt = startAt + this.config.roundDurationMs;
    const round: Round = {
      id: createId(),
      name,
      createdAt: now,
      startAt,
      endAt,
      totalScore: 0,
      winnerUserId: null,
    };
    await this.storage.saveRound(round);
    return round;
  }

  async listRounds(now: number): Promise<readonly RoundView[]> {
    const rounds = await this.storage.readRounds();
    const users = await this.storage.readUsers();
    const views: RoundView[] = [];
    for (const round of rounds) {
      const withParticipants = await this.storage.readRoundWithParticipants(round.id);
      if (!withParticipants) {
        continue;
      }
      const state = determineRoundState(withParticipants, now);
      const winnerUserId = resolveWinner(withParticipants.participants);
      const winnerName = winnerUserId ? users.find((user) => user.id === winnerUserId)?.username ?? null : null;
      views.push({
        id: round.id,
        name: round.name,
        createdAt: round.createdAt,
        startAt: round.startAt,
        endAt: round.endAt,
        state,
        totalScore: withParticipants.totalScore,
        winner: state === 'finished' ? winnerName : null,
      });
    }
    views.sort((a, b) => b.createdAt - a.createdAt);
    return views;
  }

  async getRoundView(roundId: string, user: User | null, now: number): Promise<RoundView | null> {
    const round = await this.storage.readRoundWithParticipants(roundId);
    if (!round) {
      return null;
    }
    const users = await this.storage.readUsers();
    const state = determineRoundState(round, now);
    const winnerUserId = resolveWinner(round.participants);
    const winner = state === 'finished' && winnerUserId
      ? users.find((candidate) => candidate.id === winnerUserId)?.username ?? null
      : null;
    const participant = user
      ? round.participants.find((item) => item.userId === user.id)
      : null;
    const you = !user
      ? undefined
      : this.isNikita(user)
        ? { tapCount: 0, score: 0 }
        : {
            tapCount: participant?.tapCount ?? 0,
            score: participant?.score ?? 0,
          };
    const view: RoundView = {
      id: round.id,
      name: round.name,
      createdAt: round.createdAt,
      startAt: round.startAt,
      endAt: round.endAt,
      state,
      totalScore: round.totalScore,
      winner,
      ...(you ? { you } : {}),
    };
    return view;
  }

  async tap(roundId: string, user: User, now: number): Promise<TapResult> {
    return this.storage.mutateRound(roundId, ({ round, participants }) => {
      const state = determineRoundState(round, now);
      if (state === 'scheduled') {
        throw new Error('Round has not started yet');
      }
      if (state === 'finished') {
        throw new Error('Round has already ended');
      }
      const isNikita = this.isNikita(user);
      let participant = participants.find((item) => item.userId === user.id);
      if (!participant) {
        participant = {
          roundId,
          userId: user.id,
          tapCount: 0,
          score: 0,
          updatedAt: now,
        };
        participants.push(participant);
      }
      const newTapCount = participant.tapCount + 1;
      const scoreIncrement = isNikita ? 0 : newTapCount % 11 === 0 ? 10 : 1;
      const newScore = participant.score + scoreIncrement;
      const updatedParticipant: RoundParticipant = {
        ...participant,
        tapCount: newTapCount,
        score: newScore,
        updatedAt: now,
      };
      const updatedParticipants = participants.map((item) =>
        item.userId === user.id ? updatedParticipant : item,
      );
      const updatedRound: Round = {
        ...round,
        totalScore: round.totalScore + scoreIncrement,
      };
      const updatedState = determineRoundState(updatedRound, now);
      const result: TapResult = {
        userScore: isNikita ? 0 : updatedParticipant.score,
        userTapCount: isNikita ? 0 : updatedParticipant.tapCount,
        totalScore: updatedRound.totalScore,
        roundState: updatedState,
      };
      return { round: updatedRound, participants: updatedParticipants, result };
    });
  }

  private createAuthToken(user: User, now: number): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role,
      username: user.username,
      issuedAt: now,
    };
    return createToken(payload, this.config.jwtSecret);
  }

  private normalizeUsername(username: string): string {
    return username.trim();
  }

  private resolveRole(username: string): UserRole {
    const normalized = username.trim().toLowerCase();
    if (normalized === 'admin') {
      return 'admin';
    }
    if (normalized === 'никита' || normalized === 'nikita') {
      return 'nikita';
    }
    return 'survivor';
  }

  private ensureAdmin(user: User): void {
    if (user.role !== 'admin') {
      throw new Error('Admin privileges required');
    }
  }

  private isNikita(user: User): boolean {
    return user.role === 'nikita';
  }
}

function determineRoundState(round: Round, now: number): RoundState {
  if (now < round.startAt) {
    return 'scheduled';
  }
  if (now >= round.endAt) {
    return 'finished';
  }
  return 'active';
}

function resolveWinner(participants: readonly RoundParticipant[]): string | null {
  let winner: RoundParticipant | null = null;
  for (const participant of participants) {
    if (participant.score <= 0) {
      continue;
    }
    if (!winner) {
      winner = participant;
      continue;
    }
    if (participant.score > winner.score) {
      winner = participant;
      continue;
    }
    if (participant.score === winner.score && participant.updatedAt < winner.updatedAt) {
      winner = participant;
    }
  }
  return winner ? winner.userId : null;
}

export { determineRoundState };
