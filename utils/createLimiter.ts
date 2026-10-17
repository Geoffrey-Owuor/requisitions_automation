// Per-process concurrency limiter for outbound calls (Graph). Bursts of
// notifications otherwise fire every request at once from every PM2 worker,
// which is what saturates the uplink / upstream during peaks.
// `limit(fn)` runs fn as soon as fewer than `maxConcurrent` are active,
// otherwise queues it FIFO.
export function createLimiter(maxConcurrent: number) {
  let active = 0;
  const queue: {
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }[] = [];

  const next = () => {
    if (active >= maxConcurrent || queue.length === 0) return;
    active += 1;
    const { fn, resolve, reject } = queue.shift()!;
    Promise.resolve()
      .then(fn)
      .then(resolve, reject)
      .finally(() => {
        active -= 1;
        next();
      });
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      next();
    });
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
