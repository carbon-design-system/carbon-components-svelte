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
});
