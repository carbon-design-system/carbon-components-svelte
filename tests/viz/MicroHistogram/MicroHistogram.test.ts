import { render, screen } from "@testing-library/svelte";
import MicroHistogram from "./MicroHistogram.test.svelte";

const bars = (id: string) =>
  Array.from(
    screen
      .getByTestId(id)
      .querySelectorAll<HTMLElement>(".bx--viz-micro-histogram__bar"),
  );

describe("MicroHistogram", () => {
  it("counts values into bins and names the image with the range", () => {
    render(MicroHistogram);

    expect(screen.getByRole("img", { name: "Latency: range 0–10" })).toBe(
      screen.getByTestId("basic"),
    );
    // Edges snap to round numbers: [0, 2) [2, 4) [4, 6) [6, 8) [8, 10]
    expect(
      bars("basic").map((bar) => bar.style.getPropertyValue("--bx-viz-pct")),
    ).toEqual(["20", "100", "60", "0", "20"]);
    expect(
      screen
        .getByTestId("basic")
        .querySelector(".bx--viz-micro-histogram__marker"),
    ).toBeNull();
  });

  it("is decorative without a label", () => {
    render(MicroHistogram);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
    expect(bars("decorative").length).toBeGreaterThan(1);
  });

  it("takes counted bins, places the marker, and flags its bin", () => {
    render(MicroHistogram);

    const root = screen.getByTestId("counted");
    expect(
      bars("counted").map((bar) => bar.style.getPropertyValue("--bx-viz-pct")),
    ).toEqual(["25", "100", "50"]);
    expect(
      bars("counted").map((bar) =>
        bar.classList.contains("bx--viz-micro-histogram__bar--marked"),
      ),
    ).toEqual([false, false, true]);
    expect(root).toHaveClass(
      "bx--viz-micro-histogram--marked",
      "bx--viz-micro-histogram--sm",
    );
    expect(
      root
        .querySelector<HTMLElement>(".bx--viz-micro-histogram__marker")
        ?.style.getPropertyValue("--bx-viz-pct"),
    ).toBe(String((25 / 30) * 100));
    expect(root).toHaveAccessibleName(
      "Latenz: Bereich 0 ms–30 ms, jetzt 25 ms",
    );
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
  });

  it("renders nothing to draw for no values", () => {
    render(MicroHistogram);

    expect(bars("empty")).toEqual([]);
    expect(screen.getByTestId("empty")).toHaveAccessibleName("Empty");
  });
});
