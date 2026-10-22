import { render, screen, waitFor } from "@testing-library/svelte";
import {
  type ChartTheme as ChartThemeName,
  toChartTheme,
} from "carbon-components-svelte/Theme/chart-theme.js";
import ChartTheme from "./ChartTheme.test.svelte";

const root = document.documentElement;

function chartThemeOf(testid: string) {
  return screen.getByTestId(testid).textContent;
}

afterEach(() => {
  root.removeAttribute("theme");
  root.style.removeProperty("color-scheme");
});

describe("toChartTheme", () => {
  it.each<[string | null | undefined, ChartThemeName]>([
    ["white", "white"],
    ["g10", "g10"],
    ["g80", "g90"],
    ["g90", "g90"],
    ["g100", "g100"],
    ["g50", "white"],
    ["toString", "white"],
    ["", "white"],
    [null, "white"],
    [undefined, "white"],
  ])("maps %s to %s", (theme, expected) => {
    expect(toChartTheme(theme)).toBe(expected);
  });
});

describe("getChartTheme", () => {
  it("is white when the page sets no theme", () => {
    render(ChartTheme);

    expect(chartThemeOf("page")).toBe("white");
  });

  it("follows the theme that Theme sets", async () => {
    const { rerender } = render(ChartTheme, {
      props: { withTheme: true, theme: "g80" },
    });

    expect(chartThemeOf("page")).toBe("g90");

    await rerender({ withTheme: true, theme: "g10" });

    await waitFor(() => expect(chartThemeOf("page")).toBe("g10"));
  });

  it("follows a page theme set before mount and changed outside Theme", async () => {
    // As themeScript does before first paint.
    root.setAttribute("theme", "g100");
    render(ChartTheme);

    expect(chartThemeOf("page")).toBe("g100");

    root.setAttribute("theme", "g90");

    await waitFor(() => expect(chartThemeOf("page")).toBe("g90"));
  });

  it("follows the nearest zone instead of the page theme", async () => {
    root.setAttribute("theme", "white");
    const { rerender } = render(ChartTheme);

    expect(chartThemeOf("page")).toBe("white");
    expect(chartThemeOf("zone")).toBe("g100");
    expect(chartThemeOf("inner-zone")).toBe("g90");

    root.setAttribute("theme", "g10");
    await rerender({ zone: "g90", innerZone: "white" });

    await waitFor(() => expect(chartThemeOf("page")).toBe("g10"));
    expect(chartThemeOf("zone")).toBe("g90");
    expect(chartThemeOf("inner-zone")).toBe("white");
  });
});
