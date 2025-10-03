type RouteHandler = (params: Record<string, string>) => void;

interface RouteDefinition {
  readonly pattern: RegExp;
  readonly keys: readonly string[];
  readonly handler: RouteHandler;
}

export class Router {
  private readonly routes: RouteDefinition[] = [];
  private defaultHandler: RouteHandler | null = null;

  constructor() {
    window.addEventListener('hashchange', () => this.resolve());
  }

  register(path: string, handler: RouteHandler): void {
    const { regex, keys } = createPattern(path);
    this.routes.push({ pattern: regex, keys, handler });
  }

  setDefault(handler: RouteHandler): void {
    this.defaultHandler = handler;
  }

  start(): void {
    this.resolve();
  }

  navigate(path: string): void {
    window.location.hash = path;
  }

  private resolve(): void {
    const hash = window.location.hash || '';
    const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
    for (const route of this.routes) {
      const match = cleaned.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, index) => {
          params[key] = match[index + 1];
        });
        route.handler(params);
        return;
      }
    }
    if (this.defaultHandler) {
      this.defaultHandler({});
    }
  }
}

function createPattern(path: string): { regex: RegExp; keys: readonly string[] } {
  const segments = path.split('/').filter(Boolean);
  const keys: string[] = [];
  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    })
    .join('/');
  const regex = new RegExp(`^/${pattern}$`);
  return { regex, keys };
}
