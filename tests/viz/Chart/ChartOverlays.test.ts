import { fireEvent, render, screen, within } from "@testing-library/svelte";
import ChartTooltipRow from "../../../src/viz/Chart/ChartTooltipRow.svelte";
import { user } from "../../utils/user";
import ChartOverlays from "./ChartOverlays.test.svelte";

const chart = () => screen.getByRole("application", { name: "Revenue" });
const legend = () => within(screen.getByTestId("legend"));
const paths = () => screen.getByTestId("line").querySelectorAll("path");

async function focusSecondPoint() {
  chart().focus();
  await user.keyboard("{ArrowRight}{ArrowRight}");
}

describe("ChartRuler and ChartTooltip", () => {
  it("appear only while a point is hovered", async () => {
    render(ChartOverlays);
    expect(screen.queryByTestId("ruler")).toBeNull();
    expect(screen.queryByTestId("tooltip")).toBeNull();

    await focusSecondPoint();
    expect(screen.getByTestId("ruler")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("ruler")).toBeNull();
    expect(screen.queryByTestId("tooltip")).toBeNull();
  });

  it("lists every visible series at the hovered x, under a full x label", async () => {
    render(ChartOverlays);
    await focusSecondPoint();

    const tooltip = screen.getByTestId("tooltip");
    expect(
      tooltip.querySelector(".bx--viz-chart-tooltip__title"),
    ).toHaveTextContent("1");
    const rows = Array.from(
      tooltip.querySelectorAll(".bx--viz-chart-tooltip__row"),
    ).map((row) => row.textContent?.replace(/\s+/g, " ").trim());
    expect(rows).toEqual(["a 20", "b 60", "c 6"]);
  });

  it("is hidden from assistive technology, which hears the live region instead", async () => {
    render(ChartOverlays);
    await focusSecondPoint();

    expect(screen.getByTestId("tooltip")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.getByRole("figure").querySelector("[aria-live]"),
    ).toHaveTextContent("1: a 20, b 60, c 6");
  });

  it("flips to the other side of the ruler past the middle of the plot", async () => {
    render(ChartOverlays);
    chart().focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("tooltip")).not.toHaveClass(
      "bx--viz-chart-tooltip--flipped",
    );

    await user.keyboard("{End}");
    expect(screen.getByTestId("tooltip")).toHaveClass(
      "bx--viz-chart-tooltip--flipped",
    );
  });

  it("passes the points, formatted values, and x label to a custom slot", async () => {
    render(ChartOverlays, { customTooltip: true });
    await focusSecondPoint();

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveTextContent("Day 1");
    expect(tooltip).toHaveTextContent("Region b");
    expect(tooltip).toHaveTextContent("$60");
  });

  it("never takes the pointer, and closes once the pointer has left the chart for a moment", async () => {
    render(ChartOverlays);
    await focusSecondPoint();
    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveClass("bx--viz-chart-tooltip");

    // The grace covers the gap to a neighbor; a pointer that stays away hides it.
    await fireEvent.pointerLeave(chart(), { relatedTarget: tooltip });
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 130));
    expect(screen.queryByTestId("tooltip")).toBeNull();
  });

  it("waits for a pointer to settle before showing, but shows at once from the keyboard", async () => {
    render(ChartOverlays, { delay: 80 });
    const svg = chart();
    svg.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 640,
        height: 288,
        right: 640,
        bottom: 288,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // A pointer passing over: the ruler follows, the tooltip waits.
    await fireEvent.pointerMove(svg, { clientX: 320, clientY: 100 });
    await wait(30);
    expect(screen.getByTestId("ruler")).toBeInTheDocument();
    expect(screen.queryByTestId("tooltip")).toBeNull();
    await fireEvent.pointerLeave(svg);
    await wait(120);
    expect(screen.queryByTestId("tooltip")).toBeNull();

    // A pointer that rests: the tooltip shows after the delay, then follows.
    await fireEvent.pointerMove(svg, { clientX: 320, clientY: 100 });
    await wait(30);
    expect(screen.queryByTestId("tooltip")).toBeNull();
    await wait(120);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    await fireEvent.pointerMove(svg, { clientX: 500, clientY: 100 });
    await wait(30);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    await fireEvent.pointerLeave(svg);
    await wait(130);
    expect(screen.queryByTestId("tooltip")).toBeNull();

    // A key press shows it at once.
    await focusSecondPoint();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });
});

describe("ChartLegend", () => {
  it("renders a pressed button per series", () => {
    render(ChartOverlays);

    const buttons = legend().getAllByRole("button");
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(
      buttons.every((b) => b.getAttribute("aria-pressed") === "true"),
    ).toBe(true);
    expect(buttons[0].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-group-3-1-1)",
    );
  });

  it("hides and shows a series, updating the bound value and the marks", async () => {
    const ontoggle = vi.fn();
    render(ChartOverlays, { ontoggle });

    await user.click(legend().getByRole("button", { name: "b" }));
    expect(screen.getByTestId("hidden")).toHaveTextContent("b");
    expect(legend().getByRole("button", { name: "b" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(paths()).toHaveLength(2);
    expect(ontoggle).toHaveBeenLastCalledWith({ series: "b", hidden: true });

    await user.click(legend().getByRole("button", { name: "b" }));
    expect(screen.getByTestId("hidden")).toHaveTextContent("");
    expect(paths()).toHaveLength(3);
  });

  it("never hides the last visible series", async () => {
    render(ChartOverlays, { hidden: ["a", "b"] });

    await user.click(legend().getByRole("button", { name: "c" }));
    expect(screen.getByTestId("hidden")).toHaveTextContent("a,b");
    expect(paths()).toHaveLength(1);
  });

  it("isolates a series on Alt click, and restores the rest on a second one", async () => {
    render(ChartOverlays);
    const b = legend().getByRole("button", { name: "b" });

    await fireEvent.click(b, { altKey: true });
    expect(screen.getByTestId("hidden")).toHaveTextContent("a,c");

    await fireEvent.click(b, { altKey: true });
    expect(screen.getByTestId("hidden")).toHaveTextContent("");
  });

  it("is omitted for a single series", () => {
    render(ChartOverlays, {
      data: [
        { day: 0, region: "a", revenue: 1 },
        { day: 1, region: "a", revenue: 2 },
      ],
    });

    expect(screen.queryByTestId("legend")).toBeNull();
  });
});

describe("ChartThreshold", () => {
  const topTick = () =>
    Math.max(
      ...Array.from(paths()).map((path) =>
        Number(path.getAttribute("d")?.match(/,([\d.]+)/)?.[1]),
      ),
    );

  it("draws a labelled rule and keeps its value inside the y domain", async () => {
    const { rerender } = render(ChartOverlays);
    const before = topTick();

    await rerender({ threshold: 200 });
    expect(screen.getByTestId("threshold")).toHaveTextContent("Target");
    // The same data now sits lower in the plot, because the domain grew.
    expect(topTick()).toBeGreaterThan(before);

    await rerender({ threshold: undefined });
    expect(screen.queryByTestId("threshold")).toBeNull();
    expect(topTick()).toBe(before);
  });

  it("follows a changed value without leaking the old one", async () => {
    const { rerender } = render(ChartOverlays, { threshold: 400 });
    const high = topTick();

    await rerender({ threshold: 100 });
    expect(topTick()).toBeLessThan(high);
  });

  it("shades a range between two values and keeps both in the y domain", async () => {
    const { rerender } = render(ChartOverlays, { threshold: 50 });
    const before = topTick();
    expect(
      screen
        .getByTestId("threshold")
        .querySelector(".bx--viz-threshold__range"),
    ).toBeNull();

    await rerender({ threshold: 50, thresholdTo: 400 });
    const range = screen
      .getByTestId("threshold")
      .querySelector(".bx--viz-threshold__range");
    const rule = screen
      .getByTestId("threshold")
      .querySelector(".bx--viz-threshold__line");
    expect(range).not.toBeNull();
    expect(topTick()).toBeGreaterThan(before);
    // The band hangs from the far value down to the rule at `y`.
    expect(
      Number(range?.getAttribute("y")) + Number(range?.getAttribute("height")),
    ).toBeCloseTo(Number(rule?.getAttribute("y1")));

    await rerender({ threshold: 50, thresholdTo: undefined });
    expect(topTick()).toBe(before);
  });

  it("applies the kind modifier", () => {
    render(ChartOverlays, { threshold: 50, thresholdKind: "warning" });

    expect(screen.getByTestId("threshold")).toHaveClass(
      "bx--viz-threshold--warning",
    );
  });

  it("pins the tooltip on click and releases it with Escape or a press outside", async () => {
    render(ChartOverlays);
    await focusSecondPoint();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();

    await fireEvent.click(chart());
    expect(screen.getByTestId("tooltip")).toHaveClass(
      "bx--viz-chart-tooltip--pinned",
    );
    await fireEvent.pointerLeave(chart());
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("tooltip")).toBeNull();

    await focusSecondPoint();
    await fireEvent.click(chart());
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId("tooltip")).toBeNull();
  });

  it("folds a long legend behind a more button", async () => {
    const data = Array.from({ length: 10 }, (_, s) => [
      { day: 0, region: `s${s}`, revenue: s },
      { day: 1, region: `s${s}`, revenue: s + 1 },
    ]).flat();
    render(ChartOverlays, { data });
    const items = () =>
      legend()
        .getAllByRole("button")
        .filter((b) => !b.classList.contains("bx--viz-legend__more"));
    expect(items()).toHaveLength(8);
    const more = legend().getByRole("button", {
      name: "+2 more",
      expanded: false,
    });

    await user.click(more);
    expect(items()).toHaveLength(10);
    await user.click(
      legend().getByRole("button", { name: "Show less", expanded: true }),
    );
    expect(items()).toHaveLength(8);
  });
});

describe("ChartTooltip rows", () => {
  const values = () =>
    Array.from(
      screen
        .getByTestId("tooltip")
        .querySelectorAll(".bx--viz-chart-tooltip__value"),
    ).map((el) => Number(el.textContent?.replace(/[^0-9.-]/g, "")));

  it("lists rows in series order, by value when asked, and folds the rest", async () => {
    const { unmount } = render(ChartOverlays, { sort: "value" });
    await focusSecondPoint();
    const byValue = values();
    expect(byValue).toEqual([...byValue].sort((a, b) => b - a));
    expect(byValue.length).toBeGreaterThan(1);
    unmount();

    render(ChartOverlays, { customTooltip: true, sort: "value", maxRows: 1 });
    await focusSecondPoint();
    expect(values()).toEqual([byValue[0]]);
    expect(screen.getByTestId("folded")).toHaveTextContent(
      String(byValue.length - 1),
    );
  });

  it("writes the fold line itself when the default body is used", async () => {
    render(ChartOverlays, { maxRows: 1 });
    await focusSecondPoint();
    expect(screen.getByTestId("tooltip")).toHaveTextContent(/\+\d more/);
  });
});

describe("compare", () => {
  it("overlays the prior period as a ghost in the series' color, out of the legend, under its row in the tooltip", async () => {
    render(ChartOverlays, { compare: { period: 1 } });
    const paths = Array.from(
      document.querySelectorAll<SVGPathElement>(".bx--viz-line__path"),
    );
    // Three series and their ghosts; a ghost shares its base's color and is dashed.
    expect(paths).toHaveLength(6);
    const ghosts = paths.filter((p) =>
      p.classList.contains("bx--viz-line__path--ghost"),
    );
    expect(ghosts).toHaveLength(3);
    expect(
      ghosts.every((p) => p.classList.contains("bx--viz-line__path--dashed")),
    ).toBe(true);
    expect(ghosts[0].style.getPropertyValue("--bx-viz-color")).toBe(
      paths[0].style.getPropertyValue("--bx-viz-color"),
    );
    expect(
      document.querySelectorAll(
        ".bx--viz-legend__item:not(.bx--viz-legend__more)",
      ),
    ).toHaveLength(3);

    await focusSecondPoint();
    const tooltip = screen.getByTestId("tooltip");
    expect(
      tooltip.querySelectorAll(".bx--viz-chart-tooltip__prior"),
    ).toHaveLength(3);
    expect(tooltip).toHaveTextContent(/prior.*\(\+100\.0%\)/);
  });
});

describe("legend emphasis and crosshair", () => {
  it("dims the other series while the pointer rests on a legend item", async () => {
    render(ChartOverlays);
    const [first] = Array.from(
      document.querySelectorAll<HTMLElement>(".bx--viz-legend__item"),
    );
    await fireEvent.mouseEnter(first);
    const dimmed = document.querySelectorAll(".bx--viz-line__path--dimmed");
    expect(dimmed).toHaveLength(2);
    await fireEvent.mouseLeave(first);
    expect(
      document.querySelectorAll(".bx--viz-line__path--dimmed"),
    ).toHaveLength(0);
  });

  it("writes the hovered x and y on the axes", async () => {
    render(ChartOverlays, { crosshair: true });
    await focusSecondPoint();
    const badges = Array.from(
      document.querySelectorAll(".bx--viz-crosshair__badge text"),
    ).map((el) => el.textContent?.trim());
    expect(badges).toHaveLength(2);
    expect(badges[0]).toBe("1");
  });
});

describe("shapes", () => {
  it("draws a symbol per series on points and a pattern per series on bars, and the legend shows them", () => {
    render(ChartOverlays, { shapes: true });
    // Three series: a circle, then a square and a triangle as paths.
    expect(
      document.querySelectorAll("circle.bx--viz-points__point").length,
    ).toBeGreaterThan(0);
    expect(
      document.querySelectorAll("path.bx--viz-points__point").length,
    ).toBeGreaterThan(0);
    const patterns = document.querySelectorAll("pattern.bx--viz-pattern");
    expect(patterns).toHaveLength(2);
    const filled = Array.from(
      document.querySelectorAll<SVGRectElement>(".bx--viz-bars__bar"),
    ).filter((rect) => rect.style.fill.startsWith("url("));
    expect(filled.length).toBeGreaterThan(0);
    expect(
      document.querySelectorAll(".bx--viz-legend__swatch--shape").length,
    ).toBe(2);
  });
});

describe("ChartTooltipRow", () => {
  it("keeps the swatch's room when asked, so a plain row lines up with colored ones", () => {
    const { unmount } = render(ChartTooltipRow, {
      label: "Change",
      value: "+1",
    });
    expect(document.querySelector(".bx--viz-chart-tooltip__swatch")).toBeNull();
    unmount();
    render(ChartTooltipRow, { label: "Change", value: "+1", indent: true });
    expect(
      document.querySelector(".bx--viz-chart-tooltip__swatch--blank"),
    ).not.toBeNull();
  });
});
