// @vitest-environment node
import path from "node:path";
import { svelteFreeTests } from "../svelte-free-tests";

const root = path.resolve(__dirname, "../..");
const free = new Set(
  svelteFreeTests(path.join(root, "tests"), path.join(root, "src")).map((f) =>
    path.relative(root, f),
  ),
);

describe("svelteFreeTests", () => {
  it("lists tests that only exercise CSS or plain utilities", () => {
    expect(free.has("tests/css/size-budget.test.ts")).toBe(true);
    expect(free.has("tests/utils/clamp-index.test.ts")).toBe(true);
  });

  it("keeps tests that render components or import Svelte through a module", () => {
    expect(free.has("tests/Button/Button.test.ts")).toBe(false);
    // Imports a util that imports `svelte/store`.
    expect(free.has("tests/utils/batch-store-updates.test.ts")).toBe(false);
  });

  it("includes itself, since it never imports Svelte", () => {
    expect(free.has("tests/utils/svelte-free-tests.test.ts")).toBe(true);
  });
});
