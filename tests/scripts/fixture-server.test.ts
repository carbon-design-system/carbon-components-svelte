// @vitest-environment node
import { fixtures } from "../../e2e/fixture-server";

describe("fixtures", () => {
  it("lists every fixture page by name, sorted", async () => {
    const names = await fixtures();
    expect(names).toContain("button");
    expect(names).toEqual([...names].sort());
    expect(names.every((n) => !n.endsWith(".html"))).toBe(true);
  });

  it("keeps only names containing the filter", async () => {
    const names = await fixtures("accordion");
    expect(names).toEqual(["accordion", "accordion-nested"]);
  });
});
