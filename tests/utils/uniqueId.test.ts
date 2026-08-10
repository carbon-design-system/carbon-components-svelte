import { uniqueId } from "../../src/utils/uniqueId.js";

describe("uniqueId", () => {
  test("defaults to a 'ccs-' prefix", () => {
    expect(uniqueId()).toMatch(/^ccs-[a-z0-9]+$/);
  });

  test("supports a custom prefix", () => {
    expect(uniqueId("cua")).toMatch(/^cua-[a-z0-9]+$/);
  });

  test("generates distinct ids across calls", () => {
    const ids = Array.from({ length: 100 }, () => uniqueId());
    expect(new Set(ids).size).toBe(ids.length);
  });
});
