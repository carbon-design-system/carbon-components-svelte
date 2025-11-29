import { themes } from "carbon-components-svelte/Theme/Theme.svelte";

describe("Theme exports", () => {
  it("should export themes const", () => {
    expect(themes).toBeDefined();
    expect(themes).toEqual({
      white: "White",
      g10: "Gray 10",
      g80: "Gray 80",
      g90: "Gray 90",
      g100: "Gray 100",
    });
  });

  it("should have all Carbon theme keys", () => {
    const themeKeys = Object.keys(themes);
    expect(themeKeys).toHaveLength(5);
    expect(themeKeys).toContain("white");
    expect(themeKeys).toContain("g10");
    expect(themeKeys).toContain("g80");
    expect(themeKeys).toContain("g90");
    expect(themeKeys).toContain("g100");
  });
});
