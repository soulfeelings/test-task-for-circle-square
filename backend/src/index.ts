import { loadConfig } from './config/env.js';
import { Storage } from './infrastructure/storage.js';
import { GameService } from './domain/game-service.js';
import { HttpServer } from './server/http.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const storage = new Storage(config.dataFile);
  const service = new GameService(storage, config);
  const server = new HttpServer(config, service, storage);
  server.start();
}

bootstrap().catch((error) => {
  console.error('Failed to start application', error);
  process.exitCode = 1;
});
