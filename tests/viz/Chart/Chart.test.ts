import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
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

    it("keeps a hovered x that the new data still holds, with its new points", async () => {
      const onhover = vi.fn();
      const base = [
        { day: 0, region: "a", revenue: 10 },
        { day: 1, region: "a", revenue: 20 },
      ];
      const { rerender } = render(Chart, { data: base, onhover });
      svg().focus();
      await user.keyboard("{ArrowRight}");
      expect(onhover).toHaveBeenLastCalledWith(
        expect.objectContaining({ x: 0 }),
      );

      await rerender({ data: [{ ...base[0], revenue: 15 }, base[1]] });
      expect(onhover).toHaveBeenLastCalledWith({
        x: 0,
        points: [{ datum: expect.anything(), series: "a", index: 0, y: 15 }],
      });

      await rerender({ data: [base[1], { day: 2, region: "a", revenue: 5 }] });
      expect(onhover).toHaveBeenLastCalledWith(null);
    });

    it("clamps the zoom to data that slid from under it, and drops it when none is left", async () => {
      const rows = (from: number) =>
        Array.from({ length: 5 }, (_, i) => ({
          day: from + i,
          region: "a",
          revenue: 10,
        }));
      const { rerender } = render(Chart, { data: rows(0), zoom: [1, 3] });
      expect(screen.getByTestId("zoom")).toHaveTextContent("1,3");

      await rerender({ data: rows(2) });
      expect(screen.getByTestId("zoom")).toHaveTextContent("2,3");

      await rerender({ data: rows(10) });
      expect(screen.getByTestId("zoom")).toHaveTextContent("");
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

    it("keeps a selection on its datum when rows are added before it, and drops it when the row goes", async () => {
      const base = [
        { day: 0, region: "a", revenue: 10 },
        { day: 1, region: "a", revenue: 20 },
        { day: 2, region: "a", revenue: 30 },
      ];
      const { rerender } = render(Chart, { data: base });
      svg().focus();
      await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
      expect(screen.getByTestId("selected")).toHaveTextContent("a:1");

      await rerender({ data: [{ day: -1, region: "a", revenue: 5 }, ...base] });
      expect(screen.getByTestId("selected")).toHaveTextContent("a:2");

      await rerender({ data: base.filter((row) => row.day !== 1) });
      expect(screen.getByTestId("selected")).toHaveTextContent("");
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

  it("covers the plot with a skeleton and marks the chart busy while loading", async () => {
    const { rerender } = render(Chart, { loading: true, data: [] });

    const figure = screen.getByTestId("chart");
    expect(figure).toHaveAttribute("aria-busy", "true");
    const skeleton = figure.querySelector(".bx--viz-chart__skeleton");
    expect(skeleton).toHaveClass("bx--skeleton__placeholder");
    // Loading never reads as empty.
    expect(figure.querySelector(".bx--viz-chart__empty")).toBeNull();

    await rerender({ loading: false });
    expect(figure).not.toHaveAttribute("aria-busy");
    expect(figure.querySelector(".bx--viz-chart__skeleton")).toBeNull();
  });

  it("says so when there is no data, and only then", async () => {
    const { rerender } = render(Chart, { data: [] });

    const figure = screen.getByTestId("chart");
    expect(figure.querySelector(".bx--viz-chart__empty")).toHaveTextContent(
      "Nothing to show",
    );

    await rerender({ data: [{ day: 0, region: "a", revenue: 1 }] });
    expect(figure.querySelector(".bx--viz-chart__empty")).toBeNull();
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

  it("appends pushed rows on the next frame, keeps the window, and starts over with data", async () => {
    const frames: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        frames.push(cb);
        return frames.length;
      });
    try {
      const base = [
        { day: 0, region: "a", revenue: 10 },
        { day: 1, region: "a", revenue: 20 },
        { day: 2, region: "a", revenue: 30 },
      ];
      const onupdate = vi.fn();
      const { rerender } = render(Chart, {
        data: base,
        maxRows: 4,
        emitUpdate: true,
        onupdate,
      });
      // The first update lands a microtask after mount.
      await tick();
      await tick();
      const before = onupdate.mock.calls.length;

      await user.click(screen.getByText("push"));
      await user.click(screen.getByText("push"));
      expect(onupdate).toHaveBeenCalledTimes(before);
      // Four rows pushed in one frame draw once, and only the last four stay.
      for (const frame of frames.splice(0)) frame(0);
      await tick();
      await tick();
      expect(onupdate).toHaveBeenCalledTimes(before + 1);
      expect(onupdate.mock.lastCall?.[0]).toMatchObject({
        count: 4,
        xDomain: [100, 103],
      });

      await rerender({ data: base.slice(0, 2) });
      await tick();
      expect(onupdate.mock.lastCall?.[0]).toMatchObject({ count: 2 });
    } finally {
      raf.mockRestore();
    }
  });

  it("lets the height follow the width under an aspect ratio", () => {
    render(Chart, { aspectRatio: 2 });
    expect(svg()).toHaveAttribute("viewBox", "0 0 640 320");
  });

  it("paints at the container's width from the first frame", () => {
    const measure = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(320);
    try {
      render(Chart, { width: "auto" });
      expect(svg()).toHaveAttribute("viewBox", "0 0 320 288");
    } finally {
      measure.mockRestore();
    }
  });

  it("opts into motion with a class the stylesheet animates under, from the second frame", async () => {
    const { container } = render(Chart, { transition: true });
    const figure = container.querySelector("figure");
    expect(figure).not.toHaveClass("bx--viz-chart--transition");

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    await tick();
    expect(figure).toHaveClass("bx--viz-chart--transition");
  });

  it("writes when the data is from in the header, and shows the error state with its slot", async () => {
    const { rerender } = render(Chart, { asOf: new Date(2026, 9, 24, 9, 41) });
    expect(document.querySelector(".bx--viz-chart__as-of")).toHaveTextContent(
      /^As of .*9:41/,
    );

    await rerender({ error: true, errorText: "Lost the connection" });
    expect(document.querySelector(".bx--viz-chart__error")).toHaveTextContent(
      "Lost the connection",
    );
    expect(document.querySelector(".bx--viz-chart__skeleton")).toBeNull();
  });
});
