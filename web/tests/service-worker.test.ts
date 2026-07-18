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
  it("ships an installable standalone manifest with scoped icons", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/manifest.json"), "utf8"));

    expect(manifest).toMatchObject({
      name: "KapitBiz Relay - Tagum Business Continuity",
      short_name: "KapitBiz Relay",
      id: "/",
      scope: "/",
      start_url: "/",
      display: "standalone",
    });
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/icon-192.png", purpose: "any" }),
      expect.objectContaining({ src: "/icon-maskable-512.png", purpose: "maskable" }),
    ]));
  });

  it("precaches the install shell during installation", async () => {
    const addAll = vi.fn().mockResolvedValue(undefined);
    const handlers = loadWorker({
      caches: {
        open: vi.fn().mockResolvedValue({ addAll }),
      },
    });
    let installation: Promise<unknown> | undefined;

    handlers.get("install")?.({
      waitUntil: (promise: Promise<unknown>) => {
        installation = promise;
      },
    });
    await installation;

    expect(addAll).toHaveBeenCalledWith(expect.arrayContaining([
      "/",
      "/manifest.json",
      "/icon-192.png",
      "/icon-512.png",
      "/icon-maskable-512.png",
    ]));
  });

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
