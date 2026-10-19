// @vitest-environment node
import { uniqueId } from "../../src/utils/unique-id.js";

describe("uniqueId", () => {
  it.each([
    [undefined, "ccs"],
    ["cua", "cua"],
  ])("prefix %s", (arg, prefix) => {
    expect(uniqueId(arg)).toMatch(new RegExp(`^${prefix}-[a-z0-9]+$`));
  });

  it("generates distinct ids across calls", () => {
    const ids = Array.from({ length: 100 }, () => uniqueId());
    expect(new Set(ids).size).toBe(ids.length);
  });
});
