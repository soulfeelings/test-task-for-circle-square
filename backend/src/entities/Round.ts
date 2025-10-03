import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { RoundScore } from './RoundScore.js';

@Entity({ name: 'rounds' })
export class Round {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  title!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  @Column({ name: 'total_points', type: 'integer', default: 0 })
  totalPoints!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RoundScore, (score) => score.round)
  scores!: RoundScore[];
}
