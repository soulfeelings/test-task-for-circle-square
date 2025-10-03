import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { appConfig } from './env.js';
import { User } from './entities/User.js';
import { Round } from './entities/Round.js';
import { RoundScore } from './entities/RoundScore.js';
import { InitialMigration1735939200000 } from './migrations/1735939200000-InitialMigration.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: appConfig.databaseUrl,
  synchronize: false,
  logging: false,
  entities: [User, Round, RoundScore],
  migrations: [InitialMigration1735939200000]
});
