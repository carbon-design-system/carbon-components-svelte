import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChartZoom from "./ChartZoom.test.svelte";

const labels = () =>
  Array.from(
    document.querySelectorAll(".bx--viz-axis--bottom .bx--viz-axis__label"),
  ).map((node) => node.textContent?.trim());

describe("ChartZoomBar", () => {
  it("offers two sliders over the whole range, and no reset until zoomed", () => {
    render(ChartZoom);

    const start = screen.getByRole("slider", { name: "Range start" });
    const end = screen.getByRole("slider", { name: "Range end" });
    expect(start).toHaveAttribute("aria-valuemin", "0");
    expect(start).toHaveAttribute("aria-valuemax", "100");
    expect(start).toHaveAttribute("aria-valuenow", "0");
    expect(end).toHaveAttribute("aria-valuenow", "100");
    expect(screen.queryByRole("button", { name: "Reset zoom" })).toBeNull();
    expect(labels().at(-1)).toBe("100");
  });

  it("narrows the x axis from the keyboard, clips the marks, and resets", async () => {
    render(ChartZoom);

    screen.getByRole("slider", { name: "Range start" }).focus();
    await user.keyboard(
      "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}",
    );
    expect(screen.getByTestId("zoom")).toHaveTextContent("10–100");
    expect(labels()[0]).toBe("10");
    expect(document.querySelector(".bx--viz-line")).toHaveAttribute(
      "clip-path",
      expect.stringMatching(/^url\(#bx-viz-clip-\d+\)$/),
    );
    // The y axis keeps its full range while the window moves.
    const top = Array.from(
      document.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label"),
    ).at(-1);
    expect(top).toHaveTextContent("200");

    screen.getByRole("slider", { name: "Range end" }).focus();
    await user.keyboard("{Home}");
    expect(screen.getByTestId("zoom")).toHaveTextContent("10–12");

    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(screen.getByTestId("zoom")).toHaveTextContent("all");
    expect(document.querySelector(".bx--viz-line")).not.toHaveAttribute(
      "clip-path",
    );
  });

  it("follows a range set from outside", async () => {
    const { rerender } = render(ChartZoom);

    await rerender({ zoom: [20, 60] });
    expect(screen.getByRole("slider", { name: "Range start" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    expect(labels()[0]).toBe("20");
    expect(labels().at(-1)).toBe("60");
  });

  it("narrows a category axis to a range of slots", async () => {
    const { rerender } = render(ChartZoom, {
      data: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => ({
        day,
        revenue: 10 + i,
      })),
    });

    const start = screen.getByRole("slider", { name: "Range start" });
    expect(start).toHaveAttribute("aria-valuemax", "4");
    expect(labels()).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);

    await rerender({ zoom: [1, 3] });
    expect(labels()).toEqual(["Tue", "Wed", "Thu"]);
    expect(start).toHaveAttribute("aria-valuetext", "Tue");
    expect(document.querySelector(".bx--viz-line")).toHaveAttribute(
      "clip-path",
      expect.stringMatching(/^url\(#bx-viz-clip-\d+\)$/),
    );
  });
});
