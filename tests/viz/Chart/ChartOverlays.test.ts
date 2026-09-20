import { fireEvent, render, screen, within } from "@testing-library/svelte";
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

  it("stays open while the pointer is over it, and closes when it leaves", async () => {
    render(ChartOverlays);
    await focusSecondPoint();
    const tooltip = screen.getByTestId("tooltip");

    await fireEvent.pointerLeave(chart(), { relatedTarget: tooltip });
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();

    await fireEvent.pointerLeave(tooltip);
    expect(screen.queryByTestId("tooltip")).toBeNull();
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

  it("applies the kind modifier", () => {
    render(ChartOverlays, { threshold: 50, thresholdKind: "warning" });

    expect(screen.getByTestId("threshold")).toHaveClass(
      "bx--viz-threshold--warning",
    );
  });
});
