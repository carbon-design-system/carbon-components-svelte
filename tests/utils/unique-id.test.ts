import { uniqueId } from "../../src/utils/unique-id.js";

describe("uniqueId", () => {
  it("defaults to a 'ccs-' prefix", () => {
    expect(uniqueId()).toMatch(/^ccs-[a-z0-9]+$/);
  });

  it("supports a custom prefix", () => {
    expect(uniqueId("cua")).toMatch(/^cua-[a-z0-9]+$/);
  });

  it("generates distinct ids across calls", () => {
    const ids = Array.from({ length: 100 }, () => uniqueId());
    expect(new Set(ids).size).toBe(ids.length);
  });
});
