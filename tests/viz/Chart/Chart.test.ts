import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import Chart from "./Chart.test.svelte";

const probe = () => screen.getByTestId("probe");
const svg = () =>
  screen.getByRole("application", { name: "Revenue by region" });

describe("Chart", () => {
  it("renders a titled figure with one focusable chart surface", () => {
    render(Chart);

    expect(screen.getByRole("figure")).toHaveTextContent("Revenue by region");
    expect(svg()).toHaveAttribute("aria-roledescription", "chart");
    expect(svg()).toHaveAttribute("tabindex", "0");
    expect(svg()).toHaveAttribute("viewBox", "0 0 640 288");
  });

  it("groups rows by series and gives marks scales through context", () => {
    render(Chart);

    expect(probe()).toHaveAttribute("data-series", "a,b");
    expect(probe()).toHaveAttribute("data-y-ticks", "0,20,40,60,80");
    expect(probe().getAttribute("data-x-ticks")).toMatch(/^0,.*,2$/);
  });

  it("renders without NaN for empty data", () => {
    render(Chart, { data: [] });

    expect(svg().getAttribute("viewBox")).not.toMatch(/NaN/);
    expect(probe()).toHaveAttribute("data-series", "");
  });

  it("uses categories for a string x", () => {
    render(Chart, {
      x: (row: { day: number }) => `D${row.day}`,
    });

    expect(probe()).toHaveAttribute("data-x-ticks", "D0,D1,D2");
  });

  describe("staged updates", () => {
    it("does not recompute scales when the parent re-renders with the same data", async () => {
      const onScales = vi.fn();
      const { rerender } = render(Chart, { onScales });
      const baseline = onScales.mock.calls.length;

      await rerender({ tickle: 1 });
      await rerender({ tickle: 2 });
      expect(screen.getByTestId("tickle")).toHaveTextContent("2");
      expect(onScales).toHaveBeenCalledTimes(baseline);
    });

    it("leaves scales alone for an in-range append and recomputes them once out of range", async () => {
      const onScales = vi.fn();
      const base = [
        { day: 0, region: "a", revenue: 10 },
        { day: 2, region: "a", revenue: 80 },
      ];
      const { rerender } = render(Chart, { data: base, onScales });
      const baseline = onScales.mock.calls.length;

      await rerender({ data: [...base, { day: 1, region: "a", revenue: 40 }] });
      expect(onScales).toHaveBeenCalledTimes(baseline);

      await rerender({
        data: [...base, { day: 1, region: "a", revenue: 400 }],
      });
      expect(onScales).toHaveBeenCalledTimes(baseline + 1);
      expect(probe().getAttribute("data-y-ticks")).toMatch(/400$/);
    });

    it("drops a hidden series from the domain", async () => {
      const { rerender } = render(Chart);
      expect(probe()).toHaveAttribute("data-y-ticks", "0,20,40,60,80");

      await rerender({ hidden: ["b"] });
      expect(probe()).toHaveAttribute("data-visible", "a");
      expect(probe().getAttribute("data-y-ticks")).toMatch(/^0,.*,30$/);
    });

    it("widens the domain for a value a mark asks to include, and releases it", async () => {
      const { rerender } = render(Chart, { includeY: 200 });
      expect(probe().getAttribute("data-y-ticks")).toMatch(/200$/);

      await rerender({ withProbe: false });
      await rerender({ withProbe: true, includeY: undefined });
      expect(probe()).toHaveAttribute("data-y-ticks", "0,20,40,60,80");
    });
  });

  describe("keyboard", () => {
    it("moves between data points and series, and clears on Escape", async () => {
      const onhover = vi.fn();
      render(Chart, { onhover });

      svg().focus();
      await user.keyboard("{ArrowRight}");
      expect(probe()).toHaveAttribute("data-hover-x", "0");
      expect(probe()).toHaveAttribute("data-hover-series", "a,b");

      await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      expect(probe()).toHaveAttribute("data-hover-x", "2");
      await user.keyboard("{Home}");
      expect(probe()).toHaveAttribute("data-hover-x", "0");
      await user.keyboard("{End}");
      expect(probe()).toHaveAttribute("data-hover-x", "2");
      expect(onhover).toHaveBeenLastCalledWith(
        expect.objectContaining({ x: 2 }),
      );

      await user.keyboard("{Escape}");
      expect(probe()).toHaveAttribute("data-hover-x", "");
      expect(onhover).toHaveBeenLastCalledWith(null);
    });

    it("announces the focused point with a full x label", async () => {
      render(Chart);

      svg().focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(
        screen.getByRole("figure").querySelector("[aria-live]"),
      ).toHaveTextContent("1: a 20, b 60");
    });

    it("selects the focused datum of the focused series with Enter", async () => {
      const onselect = vi.fn();
      render(Chart, { onselect });

      svg().focus();
      await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}{Enter}");
      expect(onselect).toHaveBeenCalledTimes(1);
      expect(onselect.mock.calls[0][0]).toMatchObject({
        series: "b",
        index: 1,
        datum: { day: 1, region: "b", revenue: 60 },
      });
      expect(screen.getByTestId("selected")).toHaveTextContent("b:1");
    });

    it("does not dispatch select when selected is set from outside", async () => {
      const onselect = vi.fn();
      const { rerender } = render(Chart, { onselect });

      await rerender({ selected: { series: "a", index: 0 } });
      expect(onselect).not.toHaveBeenCalled();
    });
  });

  it("clears hover when the pointer leaves", async () => {
    render(Chart);

    svg().focus();
    await user.keyboard("{ArrowRight}");
    expect(probe()).toHaveAttribute("data-hover-x", "0");
    await fireEvent.pointerLeave(svg());
    expect(probe()).toHaveAttribute("data-hover-x", "");
  });

  it("toggles a series through context, updating hidden and dispatching legend:toggle", async () => {
    const ontoggle = vi.fn();
    render(Chart, { ontoggle });

    await fireEvent.click(screen.getByTestId("toggle-b"));
    expect(screen.getByTestId("hidden")).toHaveTextContent("b");
    expect(ontoggle).toHaveBeenLastCalledWith({ series: "b", hidden: true });

    await fireEvent.click(screen.getByTestId("toggle-b"));
    expect(screen.getByTestId("hidden")).toHaveTextContent("");
    expect(ontoggle).toHaveBeenLastCalledWith({ series: "b", hidden: false });
  });

  it("dispatches update only when emitUpdate is set", async () => {
    const onupdate = vi.fn();
    const { rerender } = render(Chart, { onupdate });
    await Promise.resolve();
    expect(onupdate).not.toHaveBeenCalled();

    await rerender({ emitUpdate: true });
    await vi.waitFor(() => expect(onupdate).toHaveBeenCalled());
    expect(onupdate).toHaveBeenLastCalledWith({
      xDomain: [0, 2],
      yDomain: [0, 80],
      count: 6,
    });
  });
});
