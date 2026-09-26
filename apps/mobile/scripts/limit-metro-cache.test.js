const assert = require("node:assert/strict");
const { test } = require("node:test");
const { limitMetroCache } = require("./limit-metro-cache");

test("bounds combined reads and writes across stores and preserves results", async () => {
  let active = 0;
  let peak = 0;
  const writes = new Map();
  const store = {
    async get(key) {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setImmediate(resolve));
      active -= 1;
      return key;
    },
    async set(key, value) {
      await this.get(key);
      writes.set(key, value);
    },
    clear() {
      writes.clear();
    },
  };
  const [first, second] = limitMetroCache([store, store], 4);
  const results = await Promise.all(
    Array.from({ length: 100 }, async (_, key) => {
      await second.set(key, key * 2);
      return first.get(key);
    }),
  );
  assert.equal(peak, 4);
  assert.equal(active, 0);
  assert.deepEqual(
    results,
    Array.from({ length: 100 }, (_, key) => key),
  );
  assert.equal(writes.get(99), 198);
  first.clear();
  assert.equal(writes.size, 0);
});

test("releases queue slots after synchronous and asynchronous failures", async () => {
  const failure = new Error("cache failure");
  const [store] = limitMetroCache(
    [
      {
        get(key) {
          if (key === "sync") throw failure;
          if (key === "async") return Promise.reject(failure);
          return key;
        },
      },
    ],
    1,
  );
  const results = await Promise.allSettled([
    store.get("sync"),
    store.get("async"),
    store.get("ok"),
  ]);
  assert.deepEqual(results, [
    { status: "rejected", reason: failure },
    { status: "rejected", reason: failure },
    { status: "fulfilled", value: "ok" },
  ]);
});
