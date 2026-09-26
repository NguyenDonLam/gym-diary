// Cache reads happen before Metro's transform-worker queue. Limit cache I/O
// separately to avoid exhausting Windows file handles during large updates.
function limitMetroCache(stores, concurrency = 16) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("Cache concurrency must be a positive integer");
  }
  let active = 0;
  const waiting = [];
  async function run(operation) {
    if (active >= concurrency) {
      await new Promise((resolve) => waiting.push(resolve));
    } else {
      active += 1;
    }
    try {
      return await operation();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active -= 1;
    }
  }
  return stores.map((store) => ({
    name: store.name ?? store.constructor.name,
    get: (key) => run(() => store.get(key)),
    set: (key, value) => run(() => store.set(key, value)),
    clear: () => store.clear(),
  }));
}

module.exports = { limitMetroCache };
