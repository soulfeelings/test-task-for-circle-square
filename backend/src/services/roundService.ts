import { DataSource } from 'typeorm';
import { Round } from '../entities/Round.js';
import { RoundScore } from '../entities/RoundScore.js';
import { User, UserRole } from '../entities/User.js';
import { AppError } from '../utils/errors.js';
import { getRoundStatus } from '../utils/round.js';

export interface TapResult {
  taps: number;
  points: number;
  roundPoints: number;
}

export class RoundService {
  constructor(private readonly dataSource: DataSource) {}

  async listRounds(): Promise<Round[]> {
    const roundRepository = this.dataSource.getRepository(Round);
    return roundRepository.find({ order: { startsAt: 'DESC' } });
  }

  async getRoundOrFail(id: number): Promise<Round> {
    const roundRepository = this.dataSource.getRepository(Round);
    const round = await roundRepository.findOne({ where: { id } });
    if (!round) {
      throw new AppError('Раунд не найден', 404);
    }
    return round;
  }

  async createRound(title: string | null, startsAt: Date, endsAt: Date): Promise<Round> {
    const roundRepository = this.dataSource.getRepository(Round);
    const round = roundRepository.create({ title, startsAt, endsAt });
    return roundRepository.save(round);
  }

  async tap(roundId: number, user: User): Promise<TapResult> {
    const now = new Date();
    return this.dataSource.transaction(async (manager) => {
      const roundRepository = manager.getRepository(Round);
      const scoreRepository = manager.getRepository(RoundScore);

      const round = await roundRepository.findOne({
        where: { id: roundId },
        lock: { mode: 'pessimistic_write' }
      });
      if (!round) {
        throw new AppError('Раунд не найден', 404);
      }

      const status = getRoundStatus(round, now);
      if (status !== 'active') {
        throw new AppError('Раунд неактивен', 409);
      }

      let score = await scoreRepository.findOne({
        where: { round: { id: round.id }, user: { id: user.id } },
        relations: ['user', 'round'],
        lock: { mode: 'pessimistic_write' }
      });

      if (!score) {
        score = scoreRepository.create({ round, user, points: 0, taps: 0 });
      }

      const nextTapCount = score.taps + 1;
      const incrementPoints = user.role === UserRole.NIKITA ? 0 : nextTapCount % 11 === 0 ? 10 : 1;

      score.taps = nextTapCount;
      score.points += incrementPoints;
      await scoreRepository.save(score);

      round.totalPoints += incrementPoints;
      await roundRepository.save(round);

      return {
        taps: user.role === UserRole.NIKITA ? 0 : score.taps,
        points: user.role === UserRole.NIKITA ? 0 : score.points,
        roundPoints: round.totalPoints
      };
    });
  }

  async getRoundScores(roundId: number): Promise<RoundScore[]> {
    const scoreRepository = this.dataSource.getRepository(RoundScore);
    return scoreRepository.find({
      where: { round: { id: roundId } },
      relations: ['user'],
      order: { points: 'DESC', taps: 'DESC', updatedAt: 'ASC' }
    });
  }
}
