// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Kbd from "./Kbd.test.svelte";

describe("Kbd server render", () => {
  it("renders both platforms' keys, for CSS to show one", () => {
    const { document } = renderSSR(Kbd);
    const keys = (platform: string) =>
      [
        ...document.querySelectorAll(
          `[data-testid="sm"] .bx--kbd__platform--${platform} .bx--kbd__key`,
        ),
      ].map((key) => key.textContent);

    expect(document.querySelector('[data-testid="sm"]')?.className).toContain(
      "bx--kbd--both",
    );
    expect(keys("other")).toEqual(["Ctrl", "K"]);
    expect(keys("apple")).toEqual(["⌘", "K"]);
  });

  it("renders one platform when apple is set", () => {
    const { document } = renderSSR(Kbd);

    expect(
      document.querySelectorAll('[data-testid="apple"] .bx--kbd__platform'),
    ).toHaveLength(1);
  });
});
