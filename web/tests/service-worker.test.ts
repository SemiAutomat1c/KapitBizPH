import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

type WorkerHandler = (event: Record<string, unknown>) => void;

function loadWorker(overrides: Record<string, unknown> = {}) {
  const handlers = new Map<string, WorkerHandler>();
  const context = {
    URL,
    self: {
      location: { origin: "http://localhost" },
      clients: { claim: vi.fn() },
      skipWaiting: vi.fn(),
      addEventListener: (name: string, handler: WorkerHandler) => {
        handlers.set(name, handler);
      },
    },
    ...overrides,
  };

  runInNewContext(
    readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8"),
    context,
  );

  return handlers;
}

describe("KapitBiz service worker", () => {
  it("deletes the superseded v1 shell cache during activation", async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);
    const handlers = loadWorker({
      caches: {
        keys: vi.fn().mockResolvedValue(["kapitbiz-shell-v1"]),
        delete: deleteCache,
      },
    });
    let activation: Promise<unknown> | undefined;

    handlers.get("activate")?.({
      waitUntil: (promise: Promise<unknown>) => {
        activation = promise;
      },
    });
    await activation;

    expect(deleteCache).toHaveBeenCalledWith("kapitbiz-shell-v1");
  });

  it("uses the network response for navigation when online", async () => {
    const stalePage = { source: "v1 cache" };
    const freshPage = { source: "current deployment", ok: true, clone: vi.fn() };
    const fetchPage = vi.fn().mockResolvedValue(freshPage);
    const handlers = loadWorker({
      fetch: fetchPage,
      caches: {
        match: vi.fn().mockResolvedValue(stalePage),
        open: vi.fn().mockResolvedValue({ put: vi.fn() }),
      },
    });
    const request = {
      method: "GET",
      mode: "navigate",
      url: "http://localhost/",
    };
    let response: Promise<unknown> | undefined;

    handlers.get("fetch")?.({
      request,
      respondWith: (promise: Promise<unknown>) => {
        response = promise;
      },
    });

    await expect(response).resolves.toBe(freshPage);
    expect(fetchPage).toHaveBeenCalledWith(request);
  });
});
