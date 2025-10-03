import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Round } from './Round.js';
import { User } from './User.js';

@Entity({ name: 'round_scores' })
@Index(['round', 'user'], { unique: true })
export class RoundScore {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Round, (round) => round.scores, { onDelete: 'CASCADE' })
  round!: Round;

  @ManyToOne(() => User, (user) => user.scores, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'integer', default: 0 })
  taps!: number;

  @Column({ type: 'integer', default: 0 })
  points!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
