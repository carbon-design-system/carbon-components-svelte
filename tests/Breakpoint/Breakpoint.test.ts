import { render, screen } from "@testing-library/svelte";
import { breakpoints } from "carbon-components-svelte/Breakpoint/breakpoints";
import { tick } from "svelte";
import { stubViewport } from "../utils/match-media";
import { stubMissingMatchMedia } from "../utils/stub-match-media.js";
import Breakpoint from "./Breakpoint.test.svelte";
import BreakpointObserver from "./BreakpointObserver.test.svelte";

describe("Breakpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders and detects breakpoint size", () => {
    stubViewport(1100);

    render(Breakpoint);

    expect(screen.getByTestId("current-size").textContent).toBe("lg");
    expect(screen.getByTestId("is-sm").textContent).toBe("false");
    expect(screen.getByTestId("is-md").textContent).toBe("false");
    expect(screen.getByTestId("is-lg").textContent).toBe("true");
    expect(screen.getByTestId("is-xlg").textContent).toBe("false");
    expect(screen.getByTestId("is-max").textContent).toBe("false");
  });

  it("updates when window size changes", async () => {
    const mockChangeHandler = vi.fn();
    const viewport = stubViewport(1100);

    render(Breakpoint, { props: { onchange: mockChangeHandler } });

    expect(screen.getByTestId("current-size").textContent).toBe("lg");
    mockChangeHandler.mockClear();

    viewport.setWidth(1400);
    await tick();

    expect(mockChangeHandler).toHaveBeenCalledTimes(1);
    expect(mockChangeHandler.mock.calls[0][0].detail).toEqual({
      size: "xlg",
      breakpointValue: 1312,
    });
    expect(screen.getByTestId("current-size").textContent).toBe("xlg");
    expect(screen.getByTestId("is-xlg").textContent).toBe("true");
  });

  it.each([
    [[672], "md"],
    [[700, 672, 673], "md"],
    [[600, 672, 671], "sm"],
    [[1100, 1056, 1057], "lg"],
    [[1400, 1584, 1583], "xlg"],
  ])(
    "assigns one size at the boundary, widths %j -> %s",
    async (widths, size) => {
      const [first, ...rest] = widths as number[];
      const viewport = stubViewport(first);

      render(Breakpoint);
      for (const width of rest) viewport.setWidth(width);
      await tick();

      expect(screen.getByTestId("current-size").textContent).toBe(size);
    },
  );

  it("provides breakpointObserver utilities", () => {
    stubViewport(1100);

    render(BreakpointObserver);

    expect(screen.getByTestId("smaller-than-md").textContent).toBe("false");
    expect(screen.getByTestId("larger-than-md").textContent).toBe("true");
  });

  it.each([
    [400, "true", "false"],
    [800, "false", "false"],
  ])(
    "at width %i, smallerThan('md') is %s and largerThan('md') is %s",
    (width, smaller, larger) => {
      stubViewport(width);

      render(BreakpointObserver);

      expect(screen.getByTestId("smaller-than-md").textContent).toBe(smaller);
      expect(screen.getByTestId("larger-than-md").textContent).toBe(larger);
    },
  );

  it("throws for an unknown breakpoint size", () => {
    stubViewport(1100);

    expect(() =>
      render(BreakpointObserver, { props: { compareTo: "huge" as "md" } }),
    ).toThrow('"huge" is not a valid breakpoint size.');
  });

  it("does not throw when no media query matches (find returns undefined); derived stores emit boolean", () => {
    // NaN is a viewport that no width query matches.
    stubViewport(Number.NaN);

    render(BreakpointObserver);
    expect(screen.getByTestId("smaller-than-md").textContent).toBe("false");
    expect(screen.getByTestId("larger-than-md").textContent).toBe("false");
  });

  it("uses fallback and never dispatches change when matchMedia is missing", () => {
    stubMissingMatchMedia();
    const mockChangeHandler = vi.fn();

    render(Breakpoint, {
      props: { fallback: "md", onchange: mockChangeHandler },
    });

    expect(screen.getByTestId("current-size").textContent).toBe("md");
    expect(screen.getByTestId("is-md").textContent).toBe("true");
    expect(mockChangeHandler).not.toHaveBeenCalled();
  });

  it("prefers the measured size over the fallback", () => {
    stubViewport(1100);

    render(Breakpoint, { props: { fallback: "md" } });

    expect(screen.getByTestId("current-size").textContent).toBe("lg");
  });

  it("passes fallback through to breakpointObserver", () => {
    stubMissingMatchMedia();

    render(BreakpointObserver, { props: { fallback: "sm" } });

    expect(screen.getByTestId("smaller-than-md").textContent).toBe("true");
  });

  it("exposes breakpoint values", () => {
    expect(breakpoints).toEqual({
      sm: 320,
      md: 672,
      lg: 1056,
      xlg: 1312,
      max: 1584,
    });
  });
});
