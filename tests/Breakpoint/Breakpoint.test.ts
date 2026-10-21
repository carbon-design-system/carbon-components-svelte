import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { stubViewport } from "../utils/match-media";
import Breakpoint from "./Breakpoint.test.svelte";
import BreakpointObserver from "./BreakpointObserver.test.svelte";
import Breakpoints from "./Breakpoints.test.svelte";

describe("Breakpoint", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

  it("does not throw when no media query matches (find returns undefined); derived stores emit boolean", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(BreakpointObserver);
    expect(screen.getByTestId("smaller-than-md").textContent).toBe("false");
    expect(screen.getByTestId("larger-than-md").textContent).toBe("false");
  });

  it("exposes breakpoint values", () => {
    render(Breakpoints);

    expect(screen.getByTestId("sm").textContent).toBe("320");
    expect(screen.getByTestId("md").textContent).toBe("672");
    expect(screen.getByTestId("lg").textContent).toBe("1056");
    expect(screen.getByTestId("xlg").textContent).toBe("1312");
    expect(screen.getByTestId("max").textContent).toBe("1584");
  });
});
