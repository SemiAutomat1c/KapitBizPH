import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

const entries = new Map<string, string>();
const localStorage: Storage = {
  get length() {
    return entries.size;
  },
  clear: () => entries.clear(),
  getItem: (key) => entries.get(key) ?? null,
  key: (index) => [...entries.keys()][index] ?? null,
  removeItem: (key) => entries.delete(key),
  setItem: (key, value) => entries.set(key, String(value)),
};

Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });

afterEach(() => {
  window.localStorage.clear();
});
