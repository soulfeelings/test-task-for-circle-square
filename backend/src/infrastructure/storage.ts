import * as fs from 'node:fs';
import * as path from 'node:path';
import { AsyncLock } from '../utils/lock.js';
import type { Round, RoundParticipant, RoundWithParticipants, User } from '../domain/models.js';

interface PersistedData {
  users: User[];
  rounds: Round[];
  participants: RoundParticipant[];
}

function createEmptyData(): PersistedData {
  return {
    users: [],
    rounds: [],
    participants: [],
  };
}

function deepClone<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T;
}

export class Storage {
  private readonly lock = new AsyncLock();

  constructor(private readonly filePath: string) {
    this.ensureFile();
  }

  async readUsers(): Promise<readonly User[]> {
    return this.runRead((data) => deepClone(data.users));
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.runRead((data) => {
      const found = data.users.find((item) => item.username === username);
      return found ? { ...found } : null;
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.runRead((data) => {
      const found = data.users.find((item) => item.id === userId);
      return found ? { ...found } : null;
    });
  }

  async readRounds(): Promise<readonly Round[]> {
    return this.runRead((data) => deepClone(data.rounds));
  }

  async readRoundWithParticipants(roundId: string): Promise<RoundWithParticipants | null> {
    return this.runRead((data) => {
      const round = data.rounds.find((item) => item.id === roundId);
      if (!round) {
        return null;
      }
      const participants = data.participants.filter((item) => item.roundId === roundId);
      return { ...round, participants: deepClone(participants) };
    });
  }

  async readParticipant(roundId: string, userId: string): Promise<RoundParticipant | null> {
    return this.runRead((data) => {
      const participant = data.participants.find(
        (item) => item.roundId === roundId && item.userId === userId,
      );
      return participant ? { ...participant } : null;
    });
  }

  async createUser(user: User): Promise<void> {
    await this.runWrite((data) => {
      data.users.push(user);
    });
  }

  async updateUser(user: User): Promise<void> {
    await this.runWrite((data) => {
      const index = data.users.findIndex((item) => item.id === user.id);
      if (index >= 0) {
        data.users[index] = user;
      }
    });
  }

  async upsertParticipant(participant: RoundParticipant): Promise<void> {
    await this.runWrite((data) => {
      const index = data.participants.findIndex(
        (item) => item.roundId === participant.roundId && item.userId === participant.userId,
      );
      if (index >= 0) {
        data.participants[index] = participant;
      } else {
        data.participants.push(participant);
      }
    });
  }

  async saveRound(round: Round): Promise<void> {
    await this.runWrite((data) => {
      const index = data.rounds.findIndex((item) => item.id === round.id);
      if (index >= 0) {
        data.rounds[index] = round;
      } else {
        data.rounds.push(round);
      }
    });
  }

  async replaceRoundParticipants(roundId: string, participants: readonly RoundParticipant[]): Promise<void> {
    await this.runWrite((data) => {
      const filtered = data.participants.filter((item) => item.roundId !== roundId);
      data.participants = [...filtered, ...participants];
    });
  }

  async mutateRound<T>(roundId: string, mutator: (input: {
    round: Round;
    participants: RoundParticipant[];
  }) => { round: Round; participants: RoundParticipant[]; result: T }): Promise<T> {
    return this.runWrite((data) => {
      const roundIndex = data.rounds.findIndex((item) => item.id === roundId);
      if (roundIndex < 0) {
        throw new Error('Round not found');
      }
      const round = data.rounds[roundIndex];
      const participants = data.participants.filter((item) => item.roundId === roundId);
      const { round: updatedRound, participants: updatedParticipants, result } = mutator({
        round: { ...round },
        participants: participants.map((item) => ({ ...item })),
      });
      data.rounds[roundIndex] = updatedRound;
      const withoutRound = data.participants.filter((item) => item.roundId !== roundId);
      data.participants = [...withoutRound, ...updatedParticipants];
      return result;
    });
  }

  private async runRead<T>(task: (data: PersistedData) => T): Promise<T> {
    return this.lock.runExclusive(async () => {
      const data = this.load();
      return task(data);
    });
  }

  private async runWrite<T>(task: (data: PersistedData) => T): Promise<T> {
    return this.lock.runExclusive(async () => {
      const data = this.load();
      const result = task(data);
      this.save(data);
      return result;
    });
  }

  private ensureFile(): void {
    const directory = path.dirname(this.filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      this.save(createEmptyData());
    }
  }

  private load(): PersistedData {
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    try {
      const parsed = JSON.parse(raw) as PersistedData;
      return {
        users: parsed.users ?? [],
        rounds: parsed.rounds ?? [],
        participants: parsed.participants ?? [],
      };
    } catch (error) {
      return createEmptyData();
    }
  }

  private save(data: PersistedData): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
