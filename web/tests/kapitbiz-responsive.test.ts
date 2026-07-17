import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("KapitBiz responsive shell", () => {
  it("shows the compact progress header at the tablet breakpoint", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/kapitbiz/KapitBizRelay.module.css"),
      "utf8",
    );

    expect(css).toMatch(
      /@media \(min-width: 600px\) and \(max-width: 959px\)[\s\S]*?\.progressHeader\s*\{[\s\S]*?display:\s*flex;/,
    );
  });

  it("keeps the recommended capacity action on one mobile line", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/kapitbiz/KapitBizRelay.module.css"),
      "utf8",
    );

    expect(css).toMatch(
      /\.recommendedContent\s*>\s*\.primaryButton\s*\{[^}]*font-size:\s*0\.875rem;[^}]*white-space:\s*nowrap;/,
    );
  });
});
