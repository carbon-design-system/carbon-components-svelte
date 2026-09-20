import { render, screen } from "@testing-library/svelte";
import RangeIndicator from "./RangeIndicator.test.svelte";

const part = (id: string, name: string) =>
  screen.getByTestId(id).querySelector<HTMLElement>(`.bx--viz-range__${name}`);

describe("RangeIndicator", () => {
  it("names the image with the value, the range, and the median", () => {
    render(RangeIndicator);

    expect(
      screen.getByRole("img", {
        name: "Latency: 92, range 12–480, median 88",
      }),
    ).toBe(screen.getByTestId("basic"));
  });

  it("is decorative without a label and draws no box without quartiles", () => {
    render(RangeIndicator);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
    expect(part("decorative", "box")).toBeNull();
    expect(
      part("decorative", "value")?.style.getPropertyValue("--bx-viz-pct"),
    ).toBe("92");
  });

  it("positions the dot, the box, and the median", () => {
    render(RangeIndicator);

    const pct = (v: number) => String(((v - 12) / 468) * 100);
    expect(part("basic", "value")?.style.getPropertyValue("--bx-viz-pct")).toBe(
      pct(92),
    );
    expect(part("basic", "box")?.style.getPropertyValue("--bx-viz-start")).toBe(
      pct(40),
    );
    expect(
      Number(part("basic", "box")?.style.getPropertyValue("--bx-viz-pct")),
    ).toBeCloseTo(Number(pct(140)) - Number(pct(40)));
    expect(
      part("basic", "median")?.style.getPropertyValue("--bx-viz-pct"),
    ).toBe(pct(88));
  });

  it("marks a clamped value, writes the ends, and localizes", () => {
    render(RangeIndicator);

    const root = screen.getByTestId("outside");
    expect(part("outside", "value")).toHaveClass(
      "bx--viz-range__value--outside",
    );
    expect(
      part("outside", "value")?.style.getPropertyValue("--bx-viz-pct"),
    ).toBe("100");
    expect(
      Array.from(root.querySelectorAll(".bx--viz-range__end")).map(
        (end) => end.textContent,
      ),
    ).toEqual(["0 ms", "50 ms"]);
    expect(root).toHaveAccessibleName("Latenz: 92 ms, Bereich 0 ms–50 ms");
    expect(root).toHaveClass("bx--viz-range--sm");
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-error)",
    );
  });

  it("draws the box alone without a value", () => {
    render(RangeIndicator);

    expect(part("no-value", "value")).toBeNull();
    expect(part("no-value", "box")).not.toBeNull();
    expect(screen.getByTestId("no-value")).toHaveAccessibleName(
      "Spread: range 0–100, median 50",
    );
  });
});
