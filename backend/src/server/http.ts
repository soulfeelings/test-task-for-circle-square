import * as http from 'node:http';
import * as url from 'node:url';
import type { AppConfig } from '../config/env.js';
import type { GameService } from '../domain/game-service.js';
import type { Storage } from '../infrastructure/storage.js';
import type { User } from '../domain/models.js';
import { verifyToken } from '../utils/security.js';

interface RequestContext {
  readonly req: any;
  readonly res: any;
  readonly now: number;
  readonly user: User | null;
}

export class HttpServer {
  private server: any | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly game: GameService,
    private readonly storage: Storage,
  ) {}

  start(): void {
    if (this.server) {
      return;
    }
    this.server = http.createServer(async (req: any, res: any) => {
      try {
        await this.handleRequest(req, res);
      } catch (error) {
        this.handleError(res, error);
      }
    });
    this.server.listen(this.config.port);
    const address = this.server.address();
    const port = typeof address === 'object' && address ? address.port : this.config.port;
    console.log(`HTTP server listening on port ${port}`);
  }

  private async handleRequest(req: any, res: any): Promise<void> {
    this.applyCors(res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    const { pathname } = url.parse(req.url ?? '', true);
    if (!pathname) {
      this.sendNotFound(res);
      return;
    }
    const now = Date.now();
    const user = await this.resolveUser(req);
    const context: RequestContext = { req, res, now, user };

    if (req.method === 'POST' && pathname === '/auth/login') {
      await this.handleLogin(context);
      return;
    }
    if (!user) {
      this.sendUnauthorized(res);
      return;
    }
    if (req.method === 'GET' && pathname === '/rounds') {
      await this.handleListRounds(context);
      return;
    }
    if (req.method === 'POST' && pathname === '/rounds') {
      await this.handleCreateRound(context, user);
      return;
    }
    const tapMatch = pathname.match(/^\/rounds\/([^/]+)\/tap$/);
    if (req.method === 'POST' && tapMatch) {
      const roundId = tapMatch[1];
      await this.handleTap(context, user, roundId);
      return;
    }
    const roundMatch = pathname.match(/^\/rounds\/([^/]+)$/);
    if (req.method === 'GET' && roundMatch) {
      const roundId = roundMatch[1];
      await this.handleGetRound(context, user, roundId);
      return;
    }
    this.sendNotFound(res);
  }

  private async handleLogin(context: RequestContext): Promise<void> {
    const payload = await this.readJson(context.req);
    const body = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    try {
      const result = await this.game.login({ username, password }, context.now);
      this.sendJson(context.res, 200, {
        token: result.token,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
        },
      });
    } catch (error) {
      this.sendJson(context.res, 400, { message: error instanceof Error ? error.message : 'Login failed' });
    }
  }

  private async handleListRounds(context: RequestContext): Promise<void> {
    const rounds = await this.game.listRounds(context.now);
    this.sendJson(context.res, 200, { rounds });
  }

  private async handleCreateRound(context: RequestContext, user: User): Promise<void> {
    const payload = await this.readJson(context.req);
    const body = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const name = typeof body.name === 'string' ? body.name : undefined;
    try {
      const round = await this.game.createRound(user, { name }, context.now);
      this.sendJson(context.res, 201, { round });
    } catch (error) {
      this.sendJson(context.res, 403, { message: error instanceof Error ? error.message : 'Forbidden' });
    }
  }

  private async handleGetRound(context: RequestContext, user: User, roundId: string): Promise<void> {
    const view = await this.game.getRoundView(roundId, user, context.now);
    if (!view) {
      this.sendNotFound(context.res);
      return;
    }
    this.sendJson(context.res, 200, { round: view });
  }

  private async handleTap(context: RequestContext, user: User, roundId: string): Promise<void> {
    try {
      const result = await this.game.tap(roundId, user, context.now);
      this.sendJson(context.res, 200, { tap: result });
    } catch (error) {
      this.sendJson(context.res, 400, { message: error instanceof Error ? error.message : 'Tap failed' });
    }
  }

  private async resolveUser(req: any): Promise<User | null> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return null;
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
      return null;
    }
    const payload = verifyToken(token, this.config.jwtSecret);
    if (!payload) {
      return null;
    }
    const user = await this.storage.findUserById(payload.userId);
    return user;
  }

  private async readJson(req: any): Promise<unknown> {
    const chunks: any[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    if (chunks.length === 0) {
      return {};
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    } catch (error) {
      return {};
    }
  }

  private sendJson(res: any, status: number, payload: unknown): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  }

  private applyCors(res: any): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }

  private sendNotFound(res: any): void {
    this.sendJson(res, 404, { message: 'Not found' });
  }

  private sendUnauthorized(res: any): void {
    this.sendJson(res, 401, { message: 'Unauthorized' });
  }

  private handleError(res: any, error: unknown): void {
    console.error('Unhandled error', error);
    if (res.headersSent) {
      res.end();
      return;
    }
    this.sendJson(res, 500, { message: 'Internal Server Error' });
  }
}
