export class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(task: () => Promise<T> | T): Promise<T> {
    let release: () => void = () => undefined;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.queue;
    this.queue = next;
    await previous;
    try {
      return await task();
    } finally {
      release();
    }
  }
}
