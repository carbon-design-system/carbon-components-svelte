// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Breakpoint from "./Breakpoint.test.svelte";
import BreakpointObserver from "./BreakpointObserver.test.svelte";

describe("Breakpoint server render", () => {
  it("renders the fallback size", () => {
    const { document } = renderSSR(Breakpoint, { fallback: "lg" });

    expect(
      document.querySelector('[data-testid="current-size"]')?.textContent,
    ).toBe("lg");
    expect(document.querySelector('[data-testid="is-lg"]')?.textContent).toBe(
      "true",
    );
  });

  it("starts breakpointObserver at the fallback size", () => {
    const { document } = renderSSR(BreakpointObserver, { fallback: "sm" });

    expect(
      document.querySelector('[data-testid="smaller-than-md"]')?.textContent,
    ).toBe("true");
  });
});
