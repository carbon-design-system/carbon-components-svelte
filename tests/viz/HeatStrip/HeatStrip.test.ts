import { render, screen } from "@testing-library/svelte";
import HeatStrip from "./HeatStrip.test.svelte";

const colors = (id: string) =>
  Array.from(
    screen
      .getByTestId(id)
      .querySelectorAll<HTMLElement>(".bx--viz-heat-strip__cell"),
  ).map((cell) => cell.style.getPropertyValue("--bx-viz-color"));

describe("HeatStrip", () => {
  it("names the image with the range and where the peak is", () => {
    render(HeatStrip);

    expect(
      screen.getByRole("img", { name: "Traffic: range 0–10, peak Wed" }),
    ).toBe(screen.getByTestId("basic"));
  });

  it("is decorative without a label", () => {
    render(HeatStrip);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("colors cells from the low to the high end of the ramp", () => {
    render(HeatStrip);

    const [low, mid, high, missing] = colors("basic");
    expect(low).toBe("var(--cds-viz-seq-blue-02)");
    expect(high).toBe("var(--cds-viz-seq-blue-11)");
    expect(mid).toMatch(/^var\(--cds-viz-seq-blue-0[5-7]\)$/);
    expect(missing).toBe("");
  });

  it("hatches a missing value instead of coloring it", () => {
    render(HeatStrip);

    const cells = screen
      .getByTestId("basic")
      .querySelectorAll(".bx--viz-heat-strip__cell");
    expect(cells[3]).toHaveClass("bx--viz-heat-strip__cell--missing");
    expect(cells[0]).not.toHaveClass("bx--viz-heat-strip__cell--missing");
  });

  it("honors a fixed scale, the hue, the size, and the format", () => {
    render(HeatStrip);

    const root = screen.getByTestId("fixed");
    // 10 of 20 sits mid ramp rather than at the top.
    expect(colors("fixed")[2]).toMatch(/^var\(--cds-viz-seq-teal-0[5-7]\)$/);
    expect(root).toHaveClass("bx--viz-heat-strip--sm");
    expect(root).toHaveAccessibleName("Verkehr: Bereich 0k–10k");
  });

  it("renders no cells for no values", () => {
    render(HeatStrip);

    expect(colors("empty")).toEqual([]);
    expect(screen.getByTestId("empty")).toHaveAccessibleName("Empty");
  });
});
