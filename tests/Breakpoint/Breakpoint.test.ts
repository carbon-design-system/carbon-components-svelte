import { render, screen } from "@testing-library/svelte";
import { isSvelte4, isSvelte5 } from "../setup-tests";
import BreakpointSvelte4 from "./Breakpoint.test.svelte";
import BreakpointSvelte5 from "./Breakpoint.svelte5.test.svelte";
import BreakpointObserver from "./BreakpointObserver.test.svelte";
import Breakpoints from "./Breakpoints.test.svelte";

const Breakpoint = isSvelte5 ? BreakpointSvelte5 : BreakpointSvelte4;

describe("Breakpoint", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders and detects breakpoint size", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("(min-width: 1056px) and (max-width: 1312px)"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(Breakpoint);

    expect(screen.getByTestId("current-size").textContent).toBe("lg");
    expect(screen.getByTestId("is-sm").textContent).toBe("false");
    expect(screen.getByTestId("is-md").textContent).toBe("false");
    expect(screen.getByTestId("is-lg").textContent).toBe("true");
    expect(screen.getByTestId("is-xlg").textContent).toBe("false");
    expect(screen.getByTestId("is-max").textContent).toBe("false");
  });

  describe.skipIf(isSvelte5)("svelte 4", () => {
    it("updates when window size changes", async () => {
      const mockChangeHandler = vi.fn();
      const mediaQueryListeners = new Map();

      vi.stubGlobal("matchMedia", (query: string) => {
        const isLgQuery = query.includes(
          "(min-width: 1056px) and (max-width: 1312px)",
        );

        return {
          matches: isLgQuery,
          media: query,
          addEventListener: (event: string, listener: MediaQueryList) => {
            if (!mediaQueryListeners.has(query)) {
              mediaQueryListeners.set(query, []);
            }
            mediaQueryListeners.get(query).push({ event, listener });
          },
          removeEventListener: vi.fn(),
        };
      });

      const { component } = render(Breakpoint);
      component.$on("change", mockChangeHandler);

      expect(screen.getByTestId("current-size").textContent).toBe("lg");
      mockChangeHandler.mockClear();

      for (const [query, listeners] of mediaQueryListeners.entries()) {
        const isXlgQuery = query.includes(
          "(min-width: 1312px) and (max-width: 1584px)",
        );

        for (const { event, listener } of listeners) {
          if (event === "change") {
            listener({ matches: isXlgQuery, media: query });
          }
        }
      }

      await vi.runOnlyPendingTimersAsync();

      expect(mockChangeHandler).toHaveBeenCalled();

      component.$set({
        size: "xlg",
        sizes: {
          sm: false,
          md: false,
          lg: false,
          xlg: true,
          max: false,
        },
      });

      expect(screen.getByTestId("current-size").textContent).toBe("xlg");
      expect(screen.getByTestId("is-xlg").textContent).toBe("true");
    });
  });

  describe.skipIf(isSvelte4)("svelte 5", () => {
    it("updates when window size changes", async () => {
      const mockChangeHandler = vi.fn();
      const mediaQueryListeners = new Map();

      vi.stubGlobal("matchMedia", (query: string) => {
        const isLgQuery = query.includes(
          "(min-width: 1056px) and (max-width: 1312px)",
        );

        return {
          matches: isLgQuery,
          media: query,
          addEventListener: (event: string, listener: MediaQueryList) => {
            if (!mediaQueryListeners.has(query)) {
              mediaQueryListeners.set(query, []);
            }
            mediaQueryListeners.get(query).push({ event, listener });
          },
          removeEventListener: vi.fn(),
        };
      });

      const { rerender } = render(Breakpoint, { onchange: mockChangeHandler });

      expect(screen.getByTestId("current-size").textContent).toBe("lg");
      mockChangeHandler.mockClear();

      for (const [query, listeners] of mediaQueryListeners.entries()) {
        const isXlgQuery = query.includes(
          "(min-width: 1312px) and (max-width: 1584px)",
        );

        for (const { event, listener } of listeners) {
          if (event === "change") {
            listener({ matches: isXlgQuery, media: query });
          }
        }
      }

      await vi.runOnlyPendingTimersAsync();

      expect(mockChangeHandler).toHaveBeenCalled();

      await rerender({
        size: "xlg",
        sizes: {
          sm: false,
          md: false,
          lg: false,
          xlg: true,
          max: false,
        },
      });

      expect(screen.getByTestId("current-size").textContent).toBe("xlg");
      expect(screen.getByTestId("is-xlg").textContent).toBe("true");
    });
  });

  it("provides breakpointObserver utilities", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("(min-width: 1056px) and (max-width: 1312px)"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(BreakpointObserver);

    expect(screen.getByTestId("smaller-than-md").textContent).toBe("false");
    expect(screen.getByTestId("larger-than-md").textContent).toBe("true");
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
