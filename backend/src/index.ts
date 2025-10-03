import { AppDataSource } from './data-source.js';
import { buildServer } from './server.js';
import { appConfig } from './env.js';

async function main(): Promise<void> {
  try {
    await AppDataSource.initialize();
    const app = await buildServer();
    await app.listen({ port: appConfig.port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${appConfig.port}`);
  } catch (error) {
    console.error('Failed to start application', error);
    process.exit(1);
  }
}

void main();
